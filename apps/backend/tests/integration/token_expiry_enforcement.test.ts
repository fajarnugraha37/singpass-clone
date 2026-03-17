import { expect, test, describe, beforeAll, spyOn, afterEach, mock } from 'bun:test';
import app from '../../src/index';
import * as jose from 'jose';
import { DrizzleUserInfoRepository } from '../../src/infra/adapters/db/drizzle_userinfo_repository';
import { JoseCryptoService } from '../../src/infra/adapters/jose_crypto';
import { createEmptyMyinfoPerson } from '../../src/core/domain/myinfo-person';

describe('Token Expiry Enforcement Integration', () => {
  let clientKeyPair: jose.GenerateKeyPairResult;
  let serverKeyPair: jose.GenerateKeyPairResult;

  beforeAll(async () => {
    clientKeyPair = await jose.generateKeyPair('ES256');
    serverKeyPair = await jose.generateKeyPair('ES256');
  });

  afterEach(() => {
    mock.restore();
  });

  test('GET /userinfo should return 401 for expired token', async () => {
    const clientJwk = await jose.exportJWK(clientKeyPair.publicKey);
    const clientJkt = await jose.calculateJwkThumbprint(clientJwk);

    // Mocking an expired token in the repository
    spyOn(DrizzleUserInfoRepository.prototype, 'getAccessToken').mockImplementation(async (token: string) => {
      if (token === 'expired-token-123') {
        return {
          token: 'expired-token-123',
          userId: 'user-123',
          clientId: 'test-client',
          dpopJkt: clientJkt,
          scope: 'openid uinfin name email',
          expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
          revoked: false,
          amr: [],
          loa: 1,
        };
      }
      return null;
    });

    // DPoP proof for /userinfo
    const dpopProof = await new jose.SignJWT({
      htm: 'GET',
      htu: 'http://localhost/userinfo',
      jti: crypto.randomUUID(),
    })
      .setProtectedHeader({ alg: 'ES256', typ: 'dpop+jwt', jwk: clientJwk })
      .setIssuedAt()
      .setExpirationTime('120s')
      .sign(clientKeyPair.privateKey);

    // Send request with expired token
    const res = await app.request('/userinfo', {
      method: 'GET',
      headers: {
        'Authorization': `DPoP expired-token-123`,
        'DPoP': dpopProof,
      },
    });

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('invalid_token');
    expect(data.error_description).toContain('expired');
  });

  test('GET /userinfo should return 200 for non-expired token (sanity check)', async () => {
     const clientJwk = await jose.exportJWK(clientKeyPair.publicKey);
     const clientJkt = await jose.calculateJwkThumbprint(clientJwk);
     const clientEncKeyPair = await jose.generateKeyPair('ECDH-ES+A256KW');
     const clientEncJwk = await jose.exportJWK(clientEncKeyPair.publicKey);
     clientEncJwk.kid = 'client-enc-key';
     clientEncJwk.use = 'enc';

     // Mocks
     spyOn(DrizzleUserInfoRepository.prototype, 'getAccessToken').mockImplementation(async () => {
       return {
         token: 'valid-token-123',
         userId: 'user-123',
         clientId: 'test-client',
         dpopJkt: clientJkt,
         scope: 'openid',
         expiresAt: new Date(Date.now() + 1800000), // Valid for 30 mins
         revoked: false,
         amr: [],
         loa: 1,
       };
     });
     spyOn(DrizzleUserInfoRepository.prototype, 'getMyinfoProfile').mockImplementation(async (userId: string) => {
       if (userId === 'user-123') {
         return createEmptyMyinfoPerson(userId);
       }
       return null;
     });
     spyOn(DrizzleUserInfoRepository.prototype, 'getUserById').mockImplementation(async () => ({
       id: 'user-123',
       name: 'TEST USER'
     } as any));
     spyOn(JoseCryptoService.prototype, 'signAndEncrypt').mockImplementation(async () => 'fake.jwe.token');
     spyOn(JoseCryptoService.prototype, 'getActiveKey').mockImplementation(async () => ({
        id: 'server-kid',
        privateKey: serverKeyPair.privateKey,
        publicKey: await jose.exportJWK(serverKeyPair.publicKey)
     }));

     const dpopProof = await new jose.SignJWT({
       htm: 'GET',
       htu: 'http://localhost/userinfo',
       jti: crypto.randomUUID(),
     })
       .setProtectedHeader({ alg: 'ES256', typ: 'dpop+jwt', jwk: clientJwk })
       .setIssuedAt()
       .setExpirationTime('120s')
       .sign(clientKeyPair.privateKey);

     const res = await app.request('/userinfo', {
       method: 'GET',
       headers: {
         'Authorization': `DPoP valid-token-123`,
         'DPoP': dpopProof,
       },
     });

     expect(res.status).toBe(200);
  });
});
