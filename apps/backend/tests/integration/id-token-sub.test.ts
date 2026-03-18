import { expect, test, describe, beforeAll, spyOn, afterEach, mock } from 'bun:test';
import app from '../../src/index';
import * as jose from 'jose';
import { createHash } from 'node:crypto';
import { JoseCryptoService } from '../../src/infra/adapters/jose_crypto';
import { DrizzleClientRegistry } from '../../src/infra/adapters/client_registry';
import { DrizzleAuthorizationCodeRepository } from '../../src/infra/adapters/db/drizzle_authorization_code_repository';
import { DrizzleTokenRepository } from '../../src/infra/adapters/db/drizzle_token_repository';
import { DrizzleUserInfoRepository } from '../../src/infra/adapters/db/drizzle_userinfo_repository';

describe('ID Token Compliance: NRIC to UUID Migration', () => {
  let clientKeyPair: jose.GenerateKeyPairResult;
  let clientEncKeyPair: jose.GenerateKeyPairResult;

  beforeAll(async () => {
    clientKeyPair = await jose.generateKeyPair('ES256');
    clientEncKeyPair = await jose.generateKeyPair('ECDH-ES+A256KW');
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

  test('sub claim in ID Token MUST be a UUID and NOT an NRIC', async () => {
    const clientId = 'test-client';
    const userUuid = '550e8400-e29b-41d4-a716-446655440000';
    const userNric = 'S1234567A';
    const clientJwk = await jose.exportJWK(clientKeyPair.publicKey);
    const jkt = await jose.calculateJwkThumbprint(clientJwk);
    const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
    const challenge = calculateChallenge(verifier);

    const clientEncJwk = await jose.exportJWK(clientEncKeyPair.publicKey);
    clientEncJwk.use = 'enc';
    clientEncJwk.kid = 'enc-1';

    // Mocks
    spyOn(JoseCryptoService.prototype, 'validateDPoPNonce').mockImplementation(async () => true);
    spyOn(JoseCryptoService.prototype, 'validateClientAssertion').mockImplementation(async () => true);
    spyOn(JoseCryptoService.prototype, 'generateDPoPNonce').mockImplementation(async () => 'next-nonce');
    spyOn(DrizzleClientRegistry.prototype, 'getClientConfig').mockImplementation(async () => ({
      clientId,
      clientName: 'Test Client',
      appType: 'Login',
      redirectUris: ['https://client.example.com/cb'],
      jwks: { 
        keys: [
          { ...clientJwk, kid: 'key-1', use: 'sig' },
          clientEncJwk 
        ] 
      },
      allowedScopes: ['openid'],
      environment: 'Staging',
      hasAcceptedAgreement: true,
      isActive: true,
      uen: '123456789',
    }));
    spyOn(DrizzleAuthorizationCodeRepository.prototype, 'getByCode').mockImplementation(async () => ({
      code: 'valid-code',
      userId: userUuid,
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
      id: userUuid,
      nric: userNric,
      name: 'Test User',
      email: 'test@example.com',
      mobileno: '6512345678',
    }));

    const clientAssertion = await new jose.SignJWT({ iss: clientId, sub: clientId, aud: 'https://localhost', jti: crypto.randomUUID() })
      .setProtectedHeader({ alg: 'ES256', kid: 'key-1' })
      .sign(clientKeyPair.privateKey);

    const dpopProof = await new jose.SignJWT({
      htm: 'POST',
      htu: 'http://localhost/api/token',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 120,
      jti: crypto.randomUUID(),
      nonce: 'nonce',
    })
      .setProtectedHeader({ alg: 'ES256', typ: 'dpop+jwt', jwk: await jose.exportJWK(clientKeyPair.publicKey) })
      .sign(clientKeyPair.privateKey);

    const res = await app.request('/api/token', {
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
    const data = await res.json();
    const idToken = data.id_token;

    // Decrypt ID Token
    const { plaintext } = await jose.compactDecrypt(idToken, clientEncKeyPair.privateKey);
    const jws = new TextDecoder().decode(plaintext);
    const payload = JSON.parse(new TextDecoder().decode(jose.base64url.decode(jws.split('.')[1])));

    expect(payload.sub).toBe(userUuid);
    expect(payload.sub).not.toBe(userNric);
    // UUID regex check
    expect(payload.sub).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });
});

