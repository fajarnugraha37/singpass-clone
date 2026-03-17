import { expect, test, describe, beforeAll, spyOn, afterEach, mock } from 'bun:test';
import app from '../../src/index';
import * as jose from 'jose';
import { JoseCryptoService } from '../../src/infra/adapters/jose_crypto';
import { DrizzlePARRepository } from '../../src/infra/adapters/db/drizzle_par_repository';
import { DrizzleClientRegistry } from '../../src/infra/adapters/client_registry';
import { DrizzleAuthSessionRepository } from '../../src/infra/adapters/db/drizzle_session_repository';

describe('Consent Flow Integration: Purpose Propagation', () => {
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

  test('Purpose should be stored in PAR and propagated to session API', async () => {
    const clientId = 'test-client';
    const purpose = 'Test Purpose String';
    const requestUri = 'urn:ietf:params:oauth:request_uri:test-uuid';
    const sessionId = 'test-session-id';

    // 1. Mock Registry
    spyOn(DrizzleClientRegistry.prototype, 'getClientConfig').mockImplementation(async () => ({
      clientId,
      clientName: 'Test Client',
      appType: 'Login',
      redirectUris: ['https://client.example.com/cb'],
      jwks: { keys: [{ kid: 'test-client-key' }] },
    }));

    // 2. Mock PAR Repo
    spyOn(DrizzlePARRepository.prototype, 'isJtiConsumed').mockImplementation(async () => false);
    spyOn(DrizzlePARRepository.prototype, 'consumeJti').mockImplementation(async () => {});
    const parSaveSpy = spyOn(DrizzlePARRepository.prototype, 'save').mockImplementation(async () => {});
    spyOn(DrizzlePARRepository.prototype, 'getByRequestUri').mockImplementation(async () => ({
      requestUri,
      clientId,
      purpose,
      payload: { redirect_uri: 'https://client.example.com/cb', state: 'state' },
      expiresAt: new Date(Date.now() + 300000),
    }));

    // 3. Mock Crypto
    spyOn(JoseCryptoService.prototype, 'validateClientAssertion').mockImplementation(async () => true);
    spyOn(JoseCryptoService.prototype, 'generateDPoPNonce').mockImplementation(async () => 'nonce');

    // 4. Mock Session Repo
    const sessionSaveSpy = spyOn(DrizzleAuthSessionRepository.prototype, 'save').mockImplementation(async () => {});
    spyOn(DrizzleAuthSessionRepository.prototype, 'getById').mockImplementation(async () => ({
      id: sessionId,
      parRequestUri: requestUri,
      clientId,
      purpose,
      status: 'INITIATED',
      retryCount: 0,
      loa: 1,
      amr: [],
      expiresAt: new Date(Date.now() + 300000),
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    // --- EXECUTION ---

    // A. Create PAR
    const clientAssertion = await generateClientAssertion(clientId, 'https://vibe-auth.example.com/api/par');
    const parBody = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: 'https://client.example.com/cb',
      scope: 'openid',
      state: 'a'.repeat(30),
      nonce: 'b'.repeat(30),
      purpose,
      code_challenge: 'challenge',
      code_challenge_method: 'S256',
      client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      client_assertion: clientAssertion,
      authentication_context_type: 'APP_AUTHENTICATION_DEFAULT',
    });

    const parRes = await app.request('/api/par', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: parBody.toString(),
    });
    expect(parRes.status).toBe(201);
    expect(parSaveSpy).toHaveBeenCalled();
    const savedPar = parSaveSpy.mock.calls[0][0] as any;
    expect(savedPar.purpose).toBe(purpose);

    // B. Initiate Auth (sets cookie)
    const authRes = await app.request(`/auth?client_id=${clientId}&request_uri=${requestUri}`);
    expect(authRes.status).toBe(302);
    expect(sessionSaveSpy).toHaveBeenCalled();
    const savedSession = sessionSaveSpy.mock.calls[0][0] as any;
    expect(savedSession.purpose).toBe(purpose);

    // C. Get Session Info (reads cookie)
    // Manually pass cookie for the mock request
    const sessionRes = await app.request('/api/auth/session', {
      headers: { 'Cookie': `vibe_auth_session=${sessionId}` }
    });
    expect(sessionRes.status).toBe(200);
    const sessionData = await sessionRes.json();
    expect(sessionData.purpose).toBe(purpose);
  });
});
