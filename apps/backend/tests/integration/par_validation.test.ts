import { expect, test, describe, beforeAll, spyOn, afterEach, mock } from 'bun:test';
import app from '../../src/index';
import * as jose from 'jose';
import { JoseCryptoService } from '../../src/infra/adapters/jose_crypto';
import { DrizzlePARRepository } from '../../src/infra/adapters/db/drizzle_par_repository';
import { DrizzleClientRegistry } from '../../src/infra/adapters/client_registry';

describe('PAR Redirect URI Validation Integration', () => {
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

  test('POST /par should succeed with registered redirect_uri', async () => {
    // 0. Mocks
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
      state: 'a'.repeat(30),
      nonce: 'b'.repeat(30),
      purpose: 'Authentication',
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
    expect(data.request_uri).toBeDefined();
  });

  test('POST /par should fail with unregistered redirect_uri', async () => {
    // 0. Mocks
    spyOn(JoseCryptoService.prototype, 'validateClientAssertion').mockImplementation(async () => true);
    spyOn(DrizzleClientRegistry.prototype, 'getClientConfig').mockImplementation(async (clientId: string) => ({
      clientId,
      clientName: 'Test Client',
      appType: 'Login',
      redirectUris: ['https://client.example.com/cb'],
      jwks: { keys: [{ kid: 'test-client-key' }] },
    }));

    const clientAssertion = await generateClientAssertion('test-client', 'https://vibe-auth.example.com/api/par');

    const body = new URLSearchParams({
      response_type: 'code',
      client_id: 'test-client',
      redirect_uri: 'https://malicious.com/cb',
      scope: 'openid',
      state: 'a'.repeat(30),
      nonce: 'b'.repeat(30),
      purpose: 'Authentication',
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

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('invalid_request');
    expect(data.error_description).toBe('redirect_uri is not registered');
  });

  test('POST /par should fail if redirect_uri is missing', async () => {
    const clientAssertion = await generateClientAssertion('test-client', 'https://vibe-auth.example.com/api/par');

    const body = new URLSearchParams({
      response_type: 'code',
      client_id: 'test-client',
      // redirect_uri missing
      scope: 'openid',
      state: 'a'.repeat(30),
      nonce: 'b'.repeat(30),
      purpose: 'Authentication',
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

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('invalid_request');
    // Error description will be from Zod first if it hits the schema, or from Use Case if schema allows it
    // Our shared config has redirect_uri: z.string().url(), so Zod will catch it if missing or invalid format.
    expect(data.error_description).toBeDefined();
  });
});
