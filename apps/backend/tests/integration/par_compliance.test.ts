import { expect, test, describe, beforeAll, spyOn, afterEach, mock } from 'bun:test';
import app from '../../src/index';
import * as jose from 'jose';
import { JoseCryptoService } from '../../src/infra/adapters/jose_crypto';
import { DrizzlePARRepository } from '../../src/infra/adapters/db/drizzle_par_repository';
import { DrizzleClientRegistry } from '../../src/infra/adapters/client_registry';

describe('PAR Compliance Audit Remediation', () => {
  let clientKeyPair: jose.GenerateKeyPairResult;

  beforeAll(async () => {
    clientKeyPair = await jose.generateKeyPair('ES256');
  });

  afterEach(() => {
    mock.restore();
  });

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

  const validState = 'a'.repeat(30);
  const validNonce = 'b'.repeat(30);

  test('POST /par should fail if state is less than 30 characters', async () => {
    const clientAssertion = await generateClientAssertion('test-client', 'https://vibe-auth.example.com/api/par');

    const body = new URLSearchParams({
      response_type: 'code',
      client_id: 'test-client',
      redirect_uri: 'https://client.example.com/cb',
      scope: 'openid',
      state: 'too-short',
      nonce: validNonce,
      purpose: 'Authentication for testing',
      code_challenge: 'test-challenge',
      code_challenge_method: 'S256',
      client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      client_assertion: clientAssertion,
    });

    const res = await app.request('/api/par', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('invalid_request');
    expect(data.error_description).toContain('Too small: expected string to have >=30 characters');
  });

  test('POST /par should fail if nonce is less than 30 characters', async () => {
    const clientAssertion = await generateClientAssertion('test-client', 'https://vibe-auth.example.com/api/par');

    const body = new URLSearchParams({
      response_type: 'code',
      client_id: 'test-client',
      redirect_uri: 'https://client.example.com/cb',
      scope: 'openid',
      state: validState,
      nonce: 'too-short',
      code_challenge: 'test-challenge',
      code_challenge_method: 'S256',
      client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      client_assertion: clientAssertion,
    });

    const res = await app.request('/api/par', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('invalid_request');
    expect(data.error_description).toContain('Too small: expected string to have >=30 characters');
  });

  test('POST /par should return expires_in: 60 and DPoP-Nonce header', async () => {
    // Mocks
    spyOn(JoseCryptoService.prototype, 'validateClientAssertion').mockImplementation(async () => true);
    spyOn(JoseCryptoService.prototype, 'generateDPoPNonce').mockImplementation(async () => 'mocked-dpop-nonce');
    spyOn(DrizzleClientRegistry.prototype, 'getClientConfig').mockImplementation(async (clientId: string) => ({
      clientId,
      clientName: 'Test Client',
      appType: 'Login',
      redirectUris: ['https://client.example.com/cb'],
      jwks: { keys: [{ kid: 'test-client-key' }] },
    }));
    spyOn(DrizzlePARRepository.prototype, 'isJtiConsumed').mockImplementation(async () => false);
    spyOn(DrizzlePARRepository.prototype, 'consumeJti').mockImplementation(async () => {});
    spyOn(DrizzlePARRepository.prototype, 'save').mockImplementation(async () => {});

    const clientAssertion = await generateClientAssertion('test-client', 'https://vibe-auth.example.com/api/par');

    const body = new URLSearchParams({
      response_type: 'code',
      client_id: 'test-client',
      redirect_uri: 'https://client.example.com/cb',
      scope: 'openid',
      state: validState,
      nonce: validNonce,
      purpose: 'Authentication for testing',
      code_challenge: 'test-challenge',
      code_challenge_method: 'S256',
      client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      client_assertion: clientAssertion,
      authentication_context_type: 'APP_AUTHENTICATION_DEFAULT',
    });

    const res = await app.request('/api/par', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.expires_in).toBe(60);
    expect(res.headers.get('DPoP-Nonce')).toBe('mocked-dpop-nonce');
  });

  test('POST /par should accept optional native app parameters', async () => {
    // Mocks
    spyOn(JoseCryptoService.prototype, 'validateClientAssertion').mockImplementation(async () => true);
    spyOn(DrizzleClientRegistry.prototype, 'getClientConfig').mockImplementation(async (clientId: string) => ({
      clientId,
      clientName: 'Test Client',
      appType: 'Login',
      redirectUris: ['https://client.example.com/cb'],
      jwks: { keys: [{ kid: 'test-client-key' }] },
    }));
    spyOn(DrizzlePARRepository.prototype, 'isJtiConsumed').mockImplementation(async () => false);
    spyOn(DrizzlePARRepository.prototype, 'consumeJti').mockImplementation(async () => {});
    spyOn(DrizzlePARRepository.prototype, 'save').mockImplementation(async () => {});

    const clientAssertion = await generateClientAssertion('test-client', 'https://vibe-auth.example.com/api/par');

    const body = new URLSearchParams({
      response_type: 'code',
      client_id: 'test-client',
      redirect_uri: 'https://client.example.com/cb',
      scope: 'openid',
      state: validState,
      nonce: validNonce,
      purpose: 'Authentication for testing',
      code_challenge: 'test-challenge',
      code_challenge_method: 'S256',
      client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      client_assertion: clientAssertion,
      authentication_context_type: 'APP_AUTHENTICATION_DEFAULT',
      redirect_uri_https_type: 'app-to-app',
      app_launch_url: 'https://client.app/launch',
    });

    const res = await app.request('/api/par', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    expect(res.status).toBe(201);
  });
});
