import { expect, test, describe, beforeAll, spyOn, afterEach, mock } from 'bun:test';
import app from '../../src/index';
import * as jose from 'jose';
import { DrizzleAuthorizationCodeRepository } from '../../src/infra/adapters/db/drizzle_authorization_code_repository';
import { DrizzleTokenRepository } from '../../src/infra/adapters/db/drizzle_token_repository';
import { JoseCryptoService } from '../../src/infra/adapters/jose_crypto';
import { DrizzleUserInfoRepository } from '../../src/infra/adapters/db/drizzle_userinfo_repository';

describe('Token Exchange Integration', () => {
  let clientKeyPair: jose.GenerateKeyPairResult;
  let clientEncKeyPair: jose.GenerateKeyPairResult;
  let serverKeyPair: jose.GenerateKeyPairResult;

  beforeAll(async () => {
    clientKeyPair = await jose.generateKeyPair('ES256');
    clientEncKeyPair = await jose.generateKeyPair('ECDH-ES+A256KW');
    serverKeyPair = await jose.generateKeyPair('ES256');
  });

  afterEach(() => {
    mock.restore();
  });

  test('POST /token should exchange auth code for tokens', async () => {
    const jwk = await jose.exportJWK(clientKeyPair.publicKey);
    jwk.use = 'sig';
    jwk.kid = 'test-client-key';
    const encJwk = await jose.exportJWK(clientEncKeyPair.publicKey);
    encJwk.use = 'enc';
    encJwk.kid = 'client-enc-key';
    const jkt = await jose.calculateJwkThumbprint(jwk);

    // 0. Mocks
    spyOn(JoseCryptoService.prototype, 'validateClientAssertion').mockImplementation(async () => true);
    spyOn(JoseCryptoService.prototype, 'validateDPoPNonce').mockImplementation(async () => true);
    spyOn(JoseCryptoService.prototype, 'generateDPoPNonce').mockImplementation(async () => 'mock-nonce');
    spyOn(JoseCryptoService.prototype, 'getActiveKey').mockImplementation(async () => ({
      id: 'server-kid',
      privateKey: serverKeyPair.privateKey,
      publicKey: await jose.exportJWK(serverKeyPair.publicKey)
    }));

    spyOn(require('../../src/infra/adapters/client_registry').DrizzleClientRegistry.prototype, 'getClientConfig').mockImplementation(async () => ({
      clientId: 'test-client',
      clientSecret: 'secret',
      redirectUris: ['http://localhost:3000/cb'],
      jwks: {
        keys: [jwk, encJwk]
      }
    } as any));

    spyOn(DrizzleAuthorizationCodeRepository.prototype, 'getByCode').mockImplementation(async (code: string) => {
      if (code === 'valid-code-123') {
        return {
          code: 'valid-code-123',
          userId: 'user-123',
          clientId: 'test-client',
          codeChallenge: 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM', // matches dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk      
          dpopJkt: jkt,
          loa: 2,
          amr: ['pwd', 'otp-sms'],
          redirectUri: 'http://localhost:3000/cb',
          expiresAt: new Date(Date.now() + 300000),
          used: false,
          createdAt: new Date(),
          scope: 'openid uinfin user.identity'
        };      }
      return null;
    });
    spyOn(DrizzleAuthorizationCodeRepository.prototype, 'markAsUsed').mockImplementation(async () => {});
    spyOn(DrizzleTokenRepository.prototype, 'saveAccessToken').mockImplementation(async () => {});
    spyOn(DrizzleTokenRepository.prototype, 'saveRefreshToken').mockImplementation(async () => {});
    spyOn(DrizzleUserInfoRepository.prototype, 'getUserById').mockImplementation(async () => ({
      id: 'user-123',
      nric: 'S1234567A',
      name: 'JOHN DOE',
      email: 'john@example.com',
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
      iss: 'test-client',
      sub: 'test-client',
      aud: 'http://localhost/token',
      jti: crypto.randomUUID(),
    })
      .setProtectedHeader({ alg: 'ES256', kid: 'test-client-key' })
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(clientKeyPair.privateKey);

    // 3. Prepare request body
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code: 'valid-code-123',
      redirect_uri: 'http://localhost:3000/cb',
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

    expect(res.status).toBe(200);
    
    const data = await res.json();
    expect(data.access_token).toBeDefined();
    expect(data.id_token).toBeDefined();
    expect(data.token_type).toBe('DPoP');

    // Verify ID Token content (Task T015)
    const { plaintext } = await jose.compactDecrypt(data.id_token, clientEncKeyPair.privateKey);
    const jws = new TextDecoder().decode(plaintext);
    const payload = jose.decodeJwt(jws);
    expect(payload.sub_attributes).toBeDefined();
    expect((payload.sub_attributes as any).identity_number).toBe('S1234567A');
  });

  test('POST /token should return 400 for missing DPoP header', async () => {
    const res = await app.request('/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: 'valid-code',
      }).toString(),
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('invalid_dpop_proof');
  });
});
