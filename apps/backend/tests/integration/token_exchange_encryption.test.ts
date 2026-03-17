import { expect, test, describe, beforeAll, spyOn, afterEach, mock } from 'bun:test';
import app from '../../src/index';
import * as jose from 'jose';
import { DrizzleAuthorizationCodeRepository } from '../../src/infra/adapters/db/drizzle_authorization_code_repository';
import { DrizzleTokenRepository } from '../../src/infra/adapters/db/drizzle_token_repository';
import { JoseCryptoService } from '../../src/infra/adapters/jose_crypto';
import { DrizzleUserInfoRepository } from '../../src/infra/adapters/db/drizzle_userinfo_repository';
import { HARDENED_CLIENT_REGISTRY } from '../../src/infra/adapters/client_registry';

describe('Token Exchange Encryption Integration (mock-client-id)', () => {
  let clientKeyPair: jose.GenerateKeyPairResult;
  let serverKeyPair: jose.GenerateKeyPairResult;
  /** EC P-256 key pair used for ECDH-ES+A256KW JWE decryption in the test. */
  let encKeyPair: jose.GenerateKeyPairResult;

  /** Snapshot of the original enc JWK so we can restore it after each test. */
  let originalEncKey: jose.JWK | undefined;

  beforeAll(async () => {
    clientKeyPair = await jose.generateKeyPair('ES256');
    serverKeyPair = await jose.generateKeyPair('ES256');
    encKeyPair = await jose.generateKeyPair('ECDH-ES+A256KW', { crv: 'P-256' });
  });

  afterEach(() => {
    // Restore the original enc key in the mock registry
    const keys = HARDENED_CLIENT_REGISTRY['mock-client-id']?.jwks?.keys!;
    if (keys && originalEncKey) {
      const idx = keys.findIndex(k => k.use === 'enc');
      if (idx !== -1) {
        keys[idx] = originalEncKey;
      }
    }
    originalEncKey = undefined;
    mock.restore();
  });

  test('POST /token should return JWE ID Token for mock-client-id', async () => {
    const jwk = await jose.exportJWK(clientKeyPair.publicKey);
    const jkt = await jose.calculateJwkThumbprint(jwk);

    // 0a. Inject test encryption public key into the mock client registry
    //     so we hold the corresponding private key and can decrypt the JWE.
    const encPublicJwk = await jose.exportJWK(encKeyPair.publicKey);
    const mockClientKeys = HARDENED_CLIENT_REGISTRY['mock-client-id']?.jwks?.keys!;
    const encKeyIdx = mockClientKeys?.findIndex(k => k.use === 'enc');
    originalEncKey = { ...mockClientKeys[encKeyIdx] };
    mockClientKeys[encKeyIdx] = { 
      ...encPublicJwk,
      kid: 'mock-client-enc-key',
      use: 'enc',
      alg: 'ECDH-ES+A256KW',
    };

    // 0b. Mocks
    spyOn(JoseCryptoService.prototype, 'validateClientAssertion').mockImplementation(async () => true);
    spyOn(JoseCryptoService.prototype, 'validateDPoPNonce').mockImplementation(async () => true);
    spyOn(JoseCryptoService.prototype, 'generateDPoPNonce').mockImplementation(async () => 'mock-nonce');
    spyOn(JoseCryptoService.prototype, 'getActiveKey').mockImplementation(async () => ({
      id: 'server-kid',
      privateKey: serverKeyPair.privateKey,
      publicKey: await jose.exportJWK(serverKeyPair.publicKey)
    }));

    spyOn(DrizzleAuthorizationCodeRepository.prototype, 'getByCode').mockImplementation(async (code: string) => {
      if (code === 'valid-code-mock') {
        return {
          code: 'valid-code-mock',
          userId: 'user-123',
          clientId: 'mock-client-id',
          codeChallenge: 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
          dpopJkt: jkt,
          loa: 2,
          amr: ['pwd', 'otp-sms'],
          redirectUri: 'http://localhost:3000/callback',
          expiresAt: new Date(Date.now() + 300000),
          used: false,
          createdAt: new Date(),
          nonce: 'b'.repeat(30),
          scope: 'openid profile'
        };
      }
      return null;
    });
    
    spyOn(DrizzleAuthorizationCodeRepository.prototype, 'markAsUsed').mockImplementation(async () => {});
    spyOn(DrizzleTokenRepository.prototype, 'saveAccessToken').mockImplementation(async () => {});
    spyOn(DrizzleTokenRepository.prototype, 'saveRefreshToken').mockImplementation(async () => {});
    
    spyOn(DrizzleUserInfoRepository.prototype, 'getUserById').mockImplementation(async () => ({
      id: 'user-123',
      nric: 'S1234567A',
      name: 'John Doe',
      email: 'john@example.com',
      mobileno: '91234567',
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    // 1. Generate DPoP proof
    const dpopProof = await new jose.SignJWT({
      htm: 'POST',
      htu: 'http://localhost/token',
      jti: crypto.randomUUID(),
      nonce: 'mock-nonce',
    })
      .setProtectedHeader({ 
        alg: 'ES256', 
        typ: 'dpop+jwt', 
        jwk 
      })
      .setIssuedAt()
      .setExpirationTime('120s')
      .sign(clientKeyPair.privateKey);

    // 2. Generate Client Assertion (private_key_jwt)
    const clientAssertion = await new jose.SignJWT({
      iss: 'mock-client-id',
      sub: 'mock-client-id',
      aud: 'http://localhost/token',
      jti: crypto.randomUUID(),
    })
      .setProtectedHeader({ alg: 'ES256', kid: 'mock-client-key-1' })
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(clientKeyPair.privateKey);

    // 3. Prepare request body
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code: 'valid-code-mock',
      redirect_uri: 'http://localhost:3000/callback',
      code_verifier: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
      client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      client_assertion: clientAssertion,
    });

    // 4. Send request
    const res = await app.request('/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'DPoP': dpopProof,
      },
      body: body.toString(),
    });

    if (res.status !== 200) {
        const error = await res.json();
        console.error('Token exchange failed:', error);
    }

    expect(res.status).toBe(200);
    
    const data = await res.json();
    expect(data.id_token).toBeDefined();
    
    // 5. Verify JWE structure (5 parts separated by dots)
    const parts = data.id_token.split('.');
    expect(parts.length).toBe(5);
    
    // 6. Verify JWE protected header
    const header = JSON.parse(new TextDecoder().decode(jose.base64url.decode(parts[0])));
    expect(header.alg).toBe('ECDH-ES+A256KW');
    expect(header.enc).toBe('A256GCM');

    // 7. Decrypt the JWE using the test encryption private key
    const { plaintext: innerJws } = await jose.compactDecrypt(
      data.id_token,
      encKeyPair.privateKey,
      { keyManagementAlgorithms: ['ECDH-ES+A256KW'], contentEncryptionAlgorithms: ['A256GCM'] }
    );

    // 8. Verify the inner JWS signature using the server's public key
    const { payload: idTokenPayload, protectedHeader: jwsHeader } = await jose.jwtVerify(
      new TextDecoder().decode(innerJws),
      serverKeyPair.publicKey,
      { algorithms: ['ES256'] }
    );

    // 9. Assert inner JWS header
    expect(jwsHeader.alg).toBe('ES256');
    expect(jwsHeader.kid).toBe('server-kid');

    // 10. Assert ID Token claims
    expect(idTokenPayload.sub).toBe('user-123');
    expect(idTokenPayload.aud).toBe('mock-client-id');
    expect(idTokenPayload.nonce).toBe('b'.repeat(30));
    expect(idTokenPayload.acr).toBeDefined();
    expect(idTokenPayload.amr).toEqual(['pwd', 'otp-sms']);
    expect(idTokenPayload.iss).toBeDefined();
    expect(idTokenPayload.iat).toBeDefined();
    expect(idTokenPayload.exp).toBeDefined();
  });
});
