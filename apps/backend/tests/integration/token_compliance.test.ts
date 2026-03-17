import { expect, test, describe, beforeAll, spyOn, afterEach, mock } from 'bun:test';
import app from '../../src/index';
import * as jose from 'jose';
import { DrizzleAuthorizationCodeRepository } from '../../src/infra/adapters/db/drizzle_authorization_code_repository';
import { JoseCryptoService } from '../../src/infra/adapters/jose_crypto';

describe('Token Exchange Compliance Audit Remediation', () => {
  let clientKeyPair: jose.GenerateKeyPairResult;
  let serverKeyPair: jose.GenerateKeyPairResult;

  beforeAll(async () => {
    clientKeyPair = await jose.generateKeyPair('ES256');
    serverKeyPair = await jose.generateKeyPair('ES256');
  });

  afterEach(() => {
    mock.restore();
  });

  async function generateDPoPProof(method: string, url: string, nonce?: string) {
    const jwk = await jose.exportJWK(clientKeyPair.publicKey);
    jwk.use = 'sig';
    jwk.kid = 'test-client-key';
    
    const payload: any = {
      htm: method,
      htu: url,
      jti: crypto.randomUUID(),
    };

    if (nonce) {
      payload.nonce = nonce;
    }

    return await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: 'ES256', typ: 'dpop+jwt', jwk })
      .setIssuedAt()
      .setExpirationTime('120s')
      .sign(clientKeyPair.privateKey);
  }

  async function generateClientAssertion(clientId: string, aud: string) {
    return await new jose.SignJWT({
      iss: clientId,
      sub: clientId,
      aud: aud,
      jti: crypto.randomUUID(),
    })
      .setProtectedHeader({ alg: 'ES256', kid: 'test-client-key' })
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(clientKeyPair.privateKey);
  }

  test('POST /token should return 401 use_dpop_nonce if nonce is missing and server expects it', async () => {
    // 0. Mocks
    spyOn(JoseCryptoService.prototype, 'validateClientAssertion').mockImplementation(async () => true);
    spyOn(JoseCryptoService.prototype, 'validateDPoPNonce').mockImplementation(async () => false); // Always fail validation for this test
    spyOn(JoseCryptoService.prototype, 'generateDPoPNonce').mockImplementation(async () => 'fresh-server-nonce');
    
    spyOn(require('../../src/infra/adapters/client_registry').DrizzleClientRegistry.prototype, 'getClientConfig').mockImplementation(async () => ({
      clientId: 'test-client',
      redirectUris: ['http://localhost:3000/cb'],
      jwks: { keys: [{ kid: 'test-client-key', use: 'sig', kty: 'EC', crv: 'P-256', x: '...', y: '...' }] }
    } as any));

    const dpopProof = await generateDPoPProof('POST', 'http://localhost/token');
    const clientAssertion = await generateClientAssertion('test-client', 'http://localhost/token');

    const res = await app.request('/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'DPoP': dpopProof,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: 'valid-code',
        redirect_uri: 'http://localhost:3000/cb',
        code_verifier: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
        client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
        client_assertion: clientAssertion,
      }).toString(),
    });

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('use_dpop_nonce');
    
    // Debug headers
    // console.log('Response Headers:', JSON.stringify(Object.fromEntries(res.headers.entries())));

    const wwwAuth = res.headers.get('WWW-Authenticate') || res.headers.get('www-authenticate');
    expect(wwwAuth).toBeDefined();
    expect(wwwAuth || '').toContain('use_dpop_nonce');
    expect(res.headers.get('DPoP-Nonce')).toBe('fresh-server-nonce');
  });

  test('POST /token should succeed when valid DPoP-Nonce is provided', async () => {
    // 0. Mocks
    spyOn(JoseCryptoService.prototype, 'validateClientAssertion').mockImplementation(async () => true);
    spyOn(JoseCryptoService.prototype, 'validateDPoPNonce').mockImplementation(async () => true); // Success
    spyOn(JoseCryptoService.prototype, 'generateDPoPNonce').mockImplementation(async () => 'next-server-nonce');
    spyOn(require('../../src/infra/adapters/client_registry').DrizzleClientRegistry.prototype, 'getClientConfig').mockImplementation(async () => ({
      clientId: 'test-client',
      redirectUris: ['http://localhost:3000/cb'],
      jwks: { keys: [{ kid: 'test-client-key', use: 'sig', kty: 'EC', crv: 'P-256', x: '...', y: '...' }] }
    } as any));
    const jwk = await jose.exportJWK(clientKeyPair.publicKey);
    const jkt = await jose.calculateJwkThumbprint(jwk);

    spyOn(DrizzleAuthorizationCodeRepository.prototype, 'getByCode').mockImplementation(async () => ({
      clientId: 'test-client',
      redirectUri: 'http://localhost:3000/cb',
      codeChallenge: 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
      dpopJkt: jkt,
      scope: 'openid',
      userId: 'user-123',
      expiresAt: new Date(Date.now() + 10000),
    } as any));
    spyOn(DrizzleAuthorizationCodeRepository.prototype, 'markAsUsed').mockImplementation(async () => {});
    spyOn(require('../../src/infra/adapters/db/drizzle_token_repository').DrizzleTokenRepository.prototype, 'saveAccessToken').mockImplementation(async () => {});
    spyOn(require('../../src/infra/adapters/db/drizzle_userinfo_repository').DrizzleUserInfoRepository.prototype, 'getUserById').mockImplementation(async () => ({
      id: 'user-123',
      nric: 'S1234567A',
      name: 'JOHN DOE',
    }));
    spyOn(require('../../src/core/application/services/token.service').TokenService.prototype, 'generateTokens').mockImplementation(async () => ({
      access_token: 'at-123',
      id_token: 'id-123',
      token_type: 'DPoP',
      expires_in: 1800,
    }));

    const dpopProof = await generateDPoPProof('POST', 'http://localhost/token', 'valid-nonce');
    const clientAssertion = await generateClientAssertion('test-client', 'http://localhost/token');

    const res = await app.request('/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'DPoP': dpopProof,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: 'valid-code',
        redirect_uri: 'http://localhost:3000/cb',
        code_verifier: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
        client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
        client_assertion: clientAssertion,
      }).toString(),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('DPoP-Nonce')).toBe('next-server-nonce');
  });
});
