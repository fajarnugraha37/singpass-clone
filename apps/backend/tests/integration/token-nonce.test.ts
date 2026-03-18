import { expect, test, describe, beforeAll, spyOn, afterEach, mock } from 'bun:test';
import app from '../../src/index';
import * as jose from 'jose';
import { createHash } from 'node:crypto';
import { JoseCryptoService } from '../../src/infra/adapters/jose_crypto';
import { DrizzleClientRegistry } from '../../src/infra/adapters/client_registry';
import { DrizzleAuthorizationCodeRepository } from '../../src/infra/adapters/db/drizzle_authorization_code_repository';
import { DrizzleTokenRepository } from '../../src/infra/adapters/db/drizzle_token_repository';
import { DrizzleUserInfoRepository } from '../../src/infra/adapters/db/drizzle_userinfo_repository';

describe('Token Endpoint DPoP-Nonce Integration', () => {
  let clientKeyPair: jose.GenerateKeyPairResult;

  beforeAll(async () => {
    clientKeyPair = await jose.generateKeyPair('ES256');
  });

  afterEach(() => {
    mock.restore();
  });

  function calculateChallenge(verifier: string): string {
    return createHash('sha256')
      .update(verifier)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  async function generateDPoPProof(method: string, url: string, nonce?: string, accessToken?: string) {
    const jwtPayload: Record<string, string | number | undefined> = {
      htm: method,
      htu: url,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 120,
      jti: crypto.randomUUID(),
      nonce,
    };

    if (accessToken) {
      const ath = jose.base64url.encode(
        new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(accessToken)))
      );
      jwtPayload.ath = ath;
    }

    const jwt = new jose.SignJWT(jwtPayload);
    return await jwt
      .setProtectedHeader({ alg: 'ES256', typ: 'dpop+jwt', jwk: await jose.exportJWK(clientKeyPair.publicKey) })
      .sign(clientKeyPair.privateKey);
  }

  test('POST /token should return 401 use_dpop_nonce if nonce is invalid', async () => {
    const clientId = 'test-client';
    const invalidNonce = 'invalid-nonce';
    const freshNonce = 'fresh-server-nonce';
    const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';

    spyOn(JoseCryptoService.prototype, 'validateDPoPNonce').mockImplementation(async () => false);
    spyOn(JoseCryptoService.prototype, 'generateDPoPNonce').mockImplementation(async () => freshNonce);
    const publicJwk = await jose.exportJWK(clientKeyPair.publicKey);
    spyOn(DrizzleClientRegistry.prototype, 'getClientConfig').mockImplementation(async () => ({
      clientId,
      clientName: 'Test Client',
      appType: 'Login',
      redirectUris: ['https://client.example.com/cb'],
      jwks: { 
        keys: [
          { ...publicJwk, kid: 'key-1', use: 'sig' },
          { ...publicJwk, kid: 'key-2', use: 'enc' }
        ] 
      },
      allowedScopes: ['openid'],
      isActive: true,
      uen: 'UEN123',
      hasAcceptedAgreement: true,
      environment: 'Staging',
    }));

    const dpopProof = await generateDPoPProof('POST', 'https://localhost/api/token', invalidNonce);
    const clientAssertion = await new jose.SignJWT({ iss: clientId, sub: clientId, aud: 'https://localhost', jti: crypto.randomUUID() })
      .setProtectedHeader({ alg: 'ES256', kid: 'key-1' })
      .sign(clientKeyPair.privateKey);

    const res = await app.request('https://localhost/api/token', {
      method: 'POST',
      headers: {
        'DPoP': dpopProof,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: 'valid-code',
        redirect_uri: 'https://client.example.com/cb',
        code_verifier: verifier,
        client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
        client_assertion: clientAssertion,
      }).toString(),
    });

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('use_dpop_nonce');
    expect(res.headers.get('DPoP-Nonce')).toBe(freshNonce);
  });

  test('POST /token should succeed if valid nonce and binding provided', async () => {
    const clientId = 'test-client';
    const serverNonce = 'valid-nonce';
    const nextNonce = 'next-nonce';
    const jkt = await jose.calculateJwkThumbprint(await jose.exportJWK(clientKeyPair.publicKey));
    const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
    const challenge = calculateChallenge(verifier);

    // Mocks
    spyOn(JoseCryptoService.prototype, 'validateDPoPNonce').mockImplementation(async (n) => n === serverNonce);
    spyOn(JoseCryptoService.prototype, 'validateClientAssertion').mockImplementation(async () => true);
    spyOn(JoseCryptoService.prototype, 'generateDPoPNonce').mockImplementation(async () => nextNonce);
    const publicJwk = await jose.exportJWK(clientKeyPair.publicKey);
    spyOn(DrizzleClientRegistry.prototype, 'getClientConfig').mockImplementation(async () => ({
      clientId,
      clientName: 'Test Client',
      appType: 'Login',
      redirectUris: ['https://client.example.com/cb'],
      jwks: { 
        keys: [
          { ...publicJwk, kid: 'key-1', use: 'sig' },
          { ...publicJwk, kid: 'key-2', use: 'enc' }
        ] 
      },
      allowedScopes: ['openid'],
      isActive: true,
      uen: 'UEN123',
      hasAcceptedAgreement: true,
      environment: 'Staging',
    }));
    spyOn(DrizzleAuthorizationCodeRepository.prototype, 'getByCode').mockImplementation(async () => ({
      code: 'valid-code',
      userId: 'user-uuid',
      clientId,
      codeChallenge: challenge,
      dpopJkt: jkt,
      scope: 'openid',
      redirectUri: 'https://client.example.com/cb',
      expiresAt: new Date(Date.now() + 300000),
      used: false,
    } as any));
    spyOn(DrizzleAuthorizationCodeRepository.prototype, 'markAsUsed').mockImplementation(async () => {});
    spyOn(DrizzleTokenRepository.prototype, 'saveAccessToken').mockImplementation(async () => {});
    spyOn(DrizzleUserInfoRepository.prototype, 'getUserById').mockImplementation(async () => ({
      id: 'user-uuid',
      nric: 'S1234567A',
      name: 'Test User',
      email: 'test@example.com',
      mobileno: '91234567',
    }));

    const dpopProof = await generateDPoPProof('POST', 'https://localhost/api/token', serverNonce);
    const clientAssertion = await new jose.SignJWT({ iss: clientId, sub: clientId, aud: 'https://localhost', jti: crypto.randomUUID() })
      .setProtectedHeader({ alg: 'ES256', kid: 'key-1' })
      .sign(clientKeyPair.privateKey);

    const res = await app.request('https://localhost/api/token', {
      method: 'POST',
      headers: {
        'DPoP': dpopProof,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: 'valid-code',
        redirect_uri: 'https://client.example.com/cb',
        code_verifier: verifier,
        client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
        client_assertion: clientAssertion,
      }).toString(),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('DPoP-Nonce')).toBe(nextNonce);
    const data = await res.json();
    expect(data).toHaveProperty('access_token');
  });
});

