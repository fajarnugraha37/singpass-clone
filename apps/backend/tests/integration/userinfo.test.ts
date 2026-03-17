import { expect, test, describe, beforeAll, spyOn, afterEach, mock } from 'bun:test';
import app from '../../src/index';
import * as jose from 'jose';
import { JoseCryptoService } from '../../src/infra/adapters/jose_crypto';
import { JWKSCacheService } from '../../src/infra/adapters/jwks_cache';
import { DrizzleUserInfoRepository } from '../../src/infra/adapters/db/drizzle_userinfo_repository';
import { DrizzleClientRegistry } from '../../src/infra/adapters/client_registry';
import { createEmptyMyinfoPerson } from '../../src/core/domain/myinfo-person';

describe('UserInfo Integration', () => {
  let clientKeyPair: jose.GenerateKeyPairResult;
  let clientEncKeyPair: jose.GenerateKeyPairResult;
  let serverKeyPair: jose.GenerateKeyPairResult;

  beforeAll(async () => {
    process.env.OIDC_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\nMIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgnR+Nq5tCtTsK4JKkRkE0pEz5m/g4wGPFKnmTyXQdDYmhRANCAARhPRVqIx49NaukvjDCoqLkMmINj4BaHrFh5gZVJtbhWNTCJjR3EBVQg7MwYUEVs9vLKcyDIIxgVjaPxB39o/FY\n-----END PRIVATE KEY-----';
    clientKeyPair = await jose.generateKeyPair('ES256');
    clientEncKeyPair = await jose.generateKeyPair('ECDH-ES+A256KW');
    serverKeyPair = await jose.generateKeyPair('ES256');
    process.env.SERVER_KEY_ENCRYPTION_SECRET = '00'.repeat(32);
  });

  afterEach(() => {
    mock.restore();
  });

  test('GET /userinfo should return 200 and JWE payload', async () => {
    const clientJwk = await jose.exportJWK(clientKeyPair.publicKey);
    const clientJkt = await jose.calculateJwkThumbprint(clientJwk);
    const clientEncJwk = await jose.exportJWK(clientEncKeyPair.publicKey);
    clientEncJwk.kid = 'client-enc-key';
    clientEncJwk.use = 'enc';
    clientEncJwk.alg = 'ECDH-ES+A256KW';

    // 0. Mocks
    spyOn(DrizzleUserInfoRepository.prototype, 'getAccessToken').mockImplementation(async (token: string) => {
      if (token === 'valid-access-token-123') {
        return {
          token: 'valid-access-token-123',
          userId: 'user-123',
          clientId: 'test-client',
          dpopJkt: clientJkt,
          scope: 'openid uinfin name email',
          expiresAt: new Date(Date.now() + 3600000),
          revoked: false,
          amr: [],
          loa: 1,
        };
      }
      return null;
    });

    spyOn(DrizzleUserInfoRepository.prototype, 'getMyinfoProfile').mockImplementation(async (userId: string) => {
      if (userId === 'user-123') {
        const person = createEmptyMyinfoPerson(userId);
        person.uinfin.value = 'S1234567A';
        person.name.value = 'JOHN DOE';
        return person;
      }
      return null;
    });

    spyOn(DrizzleUserInfoRepository.prototype, 'getUserById').mockImplementation(async (userId: string) => {
      if (userId === 'user-123') {
        return {
          id: 'user-123',
          nric: 'S1234567A',
          name: 'JOHN DOE',
          email: 'john@example.com',
        };
      }
      return null;
    });

    spyOn(DrizzleClientRegistry.prototype, 'getClientConfig').mockImplementation(async (clientId: string) => {
      if (clientId === 'test-client') {
        return {
          clientId: 'test-client',
          clientName: 'Test Client',
          jwks: {
            keys: [clientEncJwk],
          },
        };
      }
      return null;
    });

    // 1. Generate DPoP proof for /userinfo
    const dpopProof = await new jose.SignJWT({
      htm: 'GET',
      htu: 'http://localhost/userinfo',
      jti: crypto.randomUUID(),
    })
      .setProtectedHeader({ 
        alg: 'ES256', 
        typ: 'dpop+jwt', 
        jwk: clientJwk 
      })
      .setIssuedAt()
      .setExpirationTime('120s')
      .sign(clientKeyPair.privateKey);

    // 2. Send request
    const res = await app.request('/userinfo', {
      method: 'GET',
      headers: {
        'Authorization': `DPoP valid-access-token-123`,
        'DPoP': dpopProof,
      },
    });

    // 3. Verify
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body.split('.').length).toBe(5); // JWE parts

    // Optional: Decrypt and verify content
    const { plaintext } = await jose.compactDecrypt(body, clientEncKeyPair.privateKey);
    const jws = new TextDecoder().decode(plaintext);
    expect(jws.split('.').length).toBe(3); // JWS parts
  });

  test('GET /userinfo should return 401 for missing Authorization header', async () => {
    const res = await app.request('/userinfo', {
      method: 'GET',
    });

    // This might also fail if stub doesn't check for headers
    expect(res.status).toBe(401);
  });
});
