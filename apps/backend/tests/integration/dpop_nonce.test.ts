import { expect, test, describe, beforeAll, spyOn, afterEach, mock } from 'bun:test';
import app from '../../src/index';
import * as jose from 'jose';
import { JoseCryptoService } from '../../src/infra/adapters/jose_crypto';

describe('DPoP Nonce Enforcement Integration', () => {
  let clientKeyPair: jose.GenerateKeyPairResult;

  beforeAll(async () => {
    clientKeyPair = await jose.generateKeyPair('ES256');
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

  test('POST /par should return 401 use_dpop_nonce if nonce is missing', async () => {
    spyOn(JoseCryptoService.prototype, 'validateClientAssertion').mockImplementation(async () => true);
    spyOn(JoseCryptoService.prototype, 'validateDPoPNonce').mockImplementation(async () => false);
    spyOn(JoseCryptoService.prototype, 'generateDPoPNonce').mockImplementation(async () => 'par-fresh-nonce');
    
    spyOn(require('../../src/infra/adapters/client_registry').DrizzleClientRegistry.prototype, 'getClientConfig').mockImplementation(async () => ({
      clientId: 'test-client',
      appType: 'Login',
      redirectUris: ['https://localhost/cb'],
      jwks: { keys: [{ kid: 'test-client-key', use: 'sig', kty: 'EC', crv: 'P-256', x: '...', y: '...' }] }
    } as any));

    const dpopProof = await generateDPoPProof('POST', 'http://localhost/api/par');
    const clientAssertion = await generateClientAssertion('test-client', 'http://localhost/api/par');

    const res = await app.request('/api/par', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'DPoP': dpopProof,
      },
      body: new URLSearchParams({
        url: 'http://localhost/api/par', // Pass absolute URL for validation
        response_type: 'code',
        client_id: 'test-client',
        redirect_uri: 'https://localhost/cb',
        scope: 'openid',
        state: 'a'.repeat(30),
        nonce: 'b'.repeat(30),
        code_challenge: 'challenge',
        code_challenge_method: 'S256',
        purpose: 'testing',
        client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
        client_assertion: clientAssertion,
        authentication_context_type: 'APP_AUTHENTICATION_DEFAULT',
      }).toString(),
    });

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('use_dpop_nonce');
    expect(res.headers.get('DPoP-Nonce')).toBe('par-fresh-nonce');
  });

  test('GET /userinfo should return 401 use_dpop_nonce if nonce is missing', async () => {
    spyOn(JoseCryptoService.prototype, 'validateDPoPNonce').mockImplementation(async () => false);
    spyOn(JoseCryptoService.prototype, 'generateDPoPNonce').mockImplementation(async () => 'ui-fresh-nonce');
    
    // Mock userinfo repository to return valid token
    spyOn(require('../../src/infra/adapters/db/drizzle_userinfo_repository').DrizzleUserInfoRepository.prototype, 'getAccessToken').mockImplementation(async () => ({
      token: 'valid-token',
      userId: 'user-123',
      clientId: 'test-client',
      dpopJkt: 'test-jkt',
      scope: 'openid',
      expiresAt: new Date(Date.now() + 10000),
    } as any));

    const dpopProof = await generateDPoPProof('GET', 'http://localhost/api/userinfo');

    const res = await app.request('/api/userinfo', {
      method: 'GET',
      headers: {
        'Authorization': 'DPoP valid-token',
        'DPoP': dpopProof,
      },
    });

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('use_dpop_nonce');
    expect(res.headers.get('DPoP-Nonce')).toBe('ui-fresh-nonce');
  });
});
