import { expect, test, describe, beforeAll, spyOn, afterEach, mock } from 'bun:test';
import app from '../../src/index';
import * as jose from 'jose';
import { DrizzleAuthorizationCodeRepository } from '../../src/infra/adapters/db/drizzle_authorization_code_repository';
import { DrizzleTokenRepository } from '../../src/infra/adapters/db/drizzle_token_repository';
import { JoseCryptoService } from '../../src/infra/adapters/jose_crypto';
import { sharedConfig } from '@vibe/shared/config';

describe('Token Expiry Configuration Integration', () => {
  let clientKeyPair: jose.GenerateKeyPairResult;
  let serverKeyPair: jose.GenerateKeyPairResult;
  const originalLifespan = sharedConfig.SECURITY.ACCESS_TOKEN_LIFESPAN;

  beforeAll(async () => {
    clientKeyPair = await jose.generateKeyPair('ES256');
    serverKeyPair = await jose.generateKeyPair('ES256');
  });

  afterEach(() => {
    mock.restore();
    sharedConfig.SECURITY.ACCESS_TOKEN_LIFESPAN = originalLifespan;
  });

  test('POST /token should reflect changes in sharedConfig.SECURITY.ACCESS_TOKEN_LIFESPAN', async () => {
    const jwk = await jose.exportJWK(clientKeyPair.publicKey);
    const jkt = await jose.calculateJwkThumbprint(jwk);

    // Mocks
    spyOn(JoseCryptoService.prototype, 'validateClientAssertion').mockImplementation(async () => true);
    spyOn(JoseCryptoService.prototype, 'getActiveKey').mockImplementation(async () => ({
      id: 'server-kid',
      privateKey: serverKeyPair.privateKey,
      publicKey: await jose.exportJWK(serverKeyPair.publicKey)
    }));

    spyOn(DrizzleAuthorizationCodeRepository.prototype, 'getByCode').mockImplementation(async () => {
      return {
        code: 'valid-code-123',
        userId: 'user-123',
        clientId: 'test-client',
        codeChallenge: 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
        dpopJkt: jkt,
        loa: 2,
        amr: ['pwd', 'otp-sms'],
        redirectUri: 'http://localhost:3000/cb',
        expiresAt: new Date(Date.now() + 300000),
        used: false,
        createdAt: new Date()
      } as any;
    });
    spyOn(DrizzleAuthorizationCodeRepository.prototype, 'markAsUsed').mockImplementation(async () => {});
    spyOn(DrizzleTokenRepository.prototype, 'saveAccessToken').mockImplementation(async () => {});
    spyOn(DrizzleTokenRepository.prototype, 'saveRefreshToken').mockImplementation(async () => {});

    // 1. Check default (1800)
    let res = await exchangeToken(clientKeyPair, jwk);
    let data = await res.json();
    expect(data.expires_in).toBe(1800);

    // 2. Change to 900
    sharedConfig.SECURITY.ACCESS_TOKEN_LIFESPAN = 900;
    res = await exchangeToken(clientKeyPair, jwk);
    data = await res.json();
    expect(data.expires_in).toBe(900);

    // 3. Change to 3600
    sharedConfig.SECURITY.ACCESS_TOKEN_LIFESPAN = 3600;
    res = await exchangeToken(clientKeyPair, jwk);
    data = await res.json();
    expect(data.expires_in).toBe(3600);
  });

  async function exchangeToken(keyPair: jose.GenerateKeyPairResult, jwk: jose.JWK) {
    const dpopProof = await new jose.SignJWT({
      htm: 'POST',
      htu: 'http://localhost/token',
      jti: crypto.randomUUID(),
    })
      .setProtectedHeader({ alg: 'ES256', typ: 'dpop+jwt', jwk })
      .setIssuedAt()
      .setExpirationTime('120s')
      .sign(keyPair.privateKey);

    const clientAssertion = await new jose.SignJWT({
      iss: 'test-client',
      sub: 'test-client',
      aud: 'http://localhost/token',
      jti: crypto.randomUUID(),
    })
      .setProtectedHeader({ alg: 'ES256', kid: 'test-client-key' })
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(keyPair.privateKey);

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code: 'valid-code-123',
      redirect_uri: 'http://localhost:3000/cb',
      code_verifier: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
      client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      client_assertion: clientAssertion,
    });

    return await app.request('/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'DPoP': dpopProof,
      },
      body: body.toString(),
    });
  }
});
