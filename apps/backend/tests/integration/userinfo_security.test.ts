import { expect, test, describe, beforeAll, spyOn, afterEach, mock } from 'bun:test';
import app from '../../src/index';
import * as jose from 'jose';
import { DrizzleUserInfoRepository } from '../../src/infra/adapters/db/drizzle_userinfo_repository';

describe('UserInfo Security Integration', () => {
  let clientKeyPair: jose.GenerateKeyPairResult;
  let otherKeyPair: jose.GenerateKeyPairResult;

  beforeAll(async () => {
    clientKeyPair = await jose.generateKeyPair('ES256');
    otherKeyPair = await jose.generateKeyPair('ES256');
    process.env.SERVER_KEY_ENCRYPTION_SECRET = '00'.repeat(32);
  });

  afterEach(() => {
    mock.restore();
  });

  test('GET /userinfo should return 401 for DPoP jkt mismatch', async () => {
    const clientJwk = await jose.exportJWK(clientKeyPair.publicKey);
    const clientJkt = await jose.calculateJwkThumbprint(clientJwk);

    const otherJwk = await jose.exportJWK(otherKeyPair.publicKey);
    const otherJkt = await jose.calculateJwkThumbprint(otherJwk);

    // 0. Mocks
    spyOn(DrizzleUserInfoRepository.prototype, 'getAccessToken').mockImplementation(async (token: string) => {
      if (token === 'bound-token-123') {
        return {
          token: 'bound-token-123',
          userId: 'user-123',
          clientId: 'test-client',
          dpopJkt: clientJkt, // Bound to clientJkt
          scope: 'openid profile',
          expiresAt: new Date(Date.now() + 3600000),
          revoked: false,
          amr: [],
          loa: 0,
        };
      }
      return null;
    });

    // 1. Generate DPoP proof with WRONG key (otherKeyPair)
    const dpopProof = await new jose.SignJWT({
      htm: 'GET',
      htu: 'http://localhost/userinfo',
      jti: crypto.randomUUID(),
      nonce: 'server-nonce',
    })
      .setProtectedHeader({ 
        alg: 'ES256', 
        typ: 'dpop+jwt', 
        jwk: otherJwk 
      })
      .setIssuedAt()
      .setExpirationTime('120s')
      .sign(otherKeyPair.privateKey);

    // Mock nonce validation
    spyOn(require('../../src/infra/adapters/jose_crypto').JoseCryptoService.prototype, 'validateDPoPNonce').mockImplementation(async (nonce: string) => nonce === 'server-nonce');
    spyOn(jose, 'decodeJwt').mockReturnValue({ nonce: 'server-nonce' } as any);

    // 2. Send request
    const res = await app.request('/userinfo', {
      method: 'GET',
      headers: {
        'Authorization': `DPoP bound-token-123`,
        'DPoP': dpopProof,
      },
    });

    // 3. Verify
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('invalid_dpop_proof');
    expect(data.error_description).toContain('jkt mismatch');
  });
});
