import { expect, test, describe, beforeAll, spyOn, afterEach, mock } from 'bun:test';
import app from '../../src/index';
import * as jose from 'jose';
import { JoseCryptoService } from '../../src/infra/adapters/jose_crypto';
import { DrizzleClientRegistry } from '../../src/infra/adapters/client_registry';
import { DrizzlePARRepository } from '../../src/infra/adapters/db/drizzle_par_repository';

describe('DPoP-Nonce Compliance: Rotation and Retry', () => {
  let clientKeyPair: jose.GenerateKeyPairResult;

  beforeAll(async () => {
    clientKeyPair = await jose.generateKeyPair('ES256');
  });

  afterEach(() => {
    mock.restore();
  });

  async function generateDPoPProof(method: string, url: string, nonce?: string) {
    return await new jose.SignJWT({
      htm: method,
      htu: url,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 120,
      jti: crypto.randomUUID(),
      nonce,
    })
      .setProtectedHeader({ alg: 'ES256', typ: 'dpop+jwt', jwk: await jose.exportJWK(clientKeyPair.publicKey) })
      .sign(clientKeyPair.privateKey);
  }

  test('POST /par should return 401 use_dpop_nonce if nonce is missing', async () => {
    const clientId = 'test-client';
    
    spyOn(JoseCryptoService.prototype, 'generateDPoPNonce').mockImplementation(async () => 'fresh-server-nonce');
    spyOn(DrizzleClientRegistry.prototype, 'getClientConfig').mockImplementation(async () => ({
      clientId,
      clientName: 'Test Client',
      appType: 'Login',
      redirectUris: ['https://client.example.com/cb'],
      allowedScopes: ['openid'],
      isActive: true,
      uen: 'UEN123',
      hasAcceptedAgreement: true,
      jwks: { keys: [] },
    }));

    const dpopProof = await generateDPoPProof('POST', 'http://localhost/api/par');

    const clientAssertion = await new jose.SignJWT({ iss: clientId, sub: clientId, aud: 'https://vibe-auth.example.com', jti: 'jti' })
      .setProtectedHeader({ alg: 'ES256', kid: 'key-1' })
      .sign(clientKeyPair.privateKey);

    const res = await app.request('/api/par', {
      method: 'POST',
      headers: {
        'DPoP': dpopProof,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: 'https://client.example.com/cb',
        scope: 'openid',
        state: 'a'.repeat(30),
        nonce: 'b'.repeat(30),
        purpose: 'test',
        code_challenge: 'challenge',
        code_challenge_method: 'S256',
        client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
        client_assertion: clientAssertion,
        authentication_context_type: 'APP_AUTHENTICATION_DEFAULT',
      }).toString(),
    });

    // FAPI 2.0 / Singpass requires 401 with DPoP-Nonce header for fresh nonce issuance
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('use_dpop_nonce');
    expect(res.headers.get('DPoP-Nonce')).toBe('fresh-server-nonce');
  });

  test('POST /par should succeed if valid nonce is provided', async () => {
    const clientId = 'test-client';
    const serverNonce = 'valid-server-nonce';

    // Mocks
    spyOn(JoseCryptoService.prototype, 'validateDPoPNonce').mockImplementation(async (n) => n === serverNonce);
    spyOn(JoseCryptoService.prototype, 'validateClientAssertion').mockImplementation(async () => true);
    spyOn(JoseCryptoService.prototype, 'generateDPoPNonce').mockImplementation(async () => 'next-nonce');
    spyOn(DrizzleClientRegistry.prototype, 'getClientConfig').mockImplementation(async () => ({
      clientId,
      clientName: 'Test Client',
      appType: 'Login',
      redirectUris: ['https://client.example.com/cb'],
      allowedScopes: ['openid'],
      isActive: true,
      uen: 'UEN123',
      hasAcceptedAgreement: true,
      jwks: { keys: [{ kid: 'key-1' }] },
    }));
    spyOn(DrizzlePARRepository.prototype, 'isJtiConsumed').mockImplementation(async () => false);
    spyOn(DrizzlePARRepository.prototype, 'consumeJti').mockImplementation(async () => {});
    spyOn(DrizzlePARRepository.prototype, 'save').mockImplementation(async () => {});

    const dpopProof = await generateDPoPProof('POST', 'http://localhost/api/par', serverNonce);
    
    // We need client_assertion for a successful PAR
    const clientAssertion = await new jose.SignJWT({ iss: clientId, sub: clientId, aud: 'https://vibe-auth.example.com', jti: 'jti' })
      .setProtectedHeader({ alg: 'ES256', kid: 'key-1' })
      .sign(clientKeyPair.privateKey);

    const res = await app.request('/api/par', {
      method: 'POST',
      headers: {
        'DPoP': dpopProof,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: 'https://client.example.com/cb',
        scope: 'openid',
        state: 'a'.repeat(30),
        nonce: 'b'.repeat(30),
        purpose: 'test',
        code_challenge: 'challenge',
        code_challenge_method: 'S256',
        client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
        client_assertion: clientAssertion,
        authentication_context_type: 'APP_AUTHENTICATION_DEFAULT',
      }).toString(),
    });

    expect(res.status).toBe(201);
    expect(res.headers.get('DPoP-Nonce')).toBe('next-nonce');
  });
});
