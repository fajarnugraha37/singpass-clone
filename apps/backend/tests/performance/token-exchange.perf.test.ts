import { expect, test, describe, beforeAll } from 'bun:test';
import { TokenExchangeUseCase } from '../../src/core/use-cases/token-exchange';
import { ClientAuthenticationService } from '../../src/core/application/services/client-auth.service';
import { TokenService } from '../../src/core/application/services/token.service';
import { DPoPValidator } from '../../src/core/utils/dpop_validator';
import * as jose from 'jose';

// Minimal Mocks for Performance Testing
const mockJtiStore: any = {
  isUsed: async () => false,
  markUsed: async () => {},
};

const mockCryptoService: any = {
  validateClientAssertion: async () => true,
  getActiveKey: async () => {
    const { publicKey, privateKey } = await jose.generateKeyPair('ES256');
    return { id: 'test-kid', privateKey, publicKey: await jose.exportJWK(publicKey) };
  },
  calculateThumbprint: async () => 'test-jkt',
};

const mockAuthCodeRepo: any = {
  getByCode: async () => ({
    clientId: 'test-client',
    redirectUri: 'http://localhost/cb',
    codeChallenge: 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
    dpopJkt: 'test-jkt',
    scope: 'openid',
    userId: 'user-123',
    expiresAt: new Date(Date.now() + 10000),
  }),
  markAsUsed: async () => {},
};

const mockTokenRepo: any = {
  saveAccessToken: async () => {},
  saveRefreshToken: async () => {},
};

describe('Token Exchange Performance', () => {
  let useCase: TokenExchangeUseCase;
  let dpopProof: string;
  let clientAssertion: string;

  beforeAll(async () => {
    const clientAuthService = new ClientAuthenticationService(mockCryptoService);
    const tokenService = new TokenService(mockCryptoService);
    const dpopValidator = new DPoPValidator(mockJtiStore);
    useCase = new TokenExchangeUseCase(
      clientAuthService,
      tokenService,
      mockAuthCodeRepo,
      mockTokenRepo,
      dpopValidator,
      'https://issuer.example.com'
    );

    const clientKeyPair = await jose.generateKeyPair('ES256');
    const jwk = await jose.exportJWK(clientKeyPair.publicKey);
    const jkt = await jose.calculateJwkThumbprint(jwk);

    // Update mock to use correct JKT
    mockAuthCodeRepo.getByCode = async () => ({
      clientId: 'test-client',
      redirectUri: 'http://localhost/cb',
      codeChallenge: 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
      dpopJkt: jkt,
      scope: 'openid',
      userId: 'user-123',
      expiresAt: new Date(Date.now() + 10000),
    });

    dpopProof = await new jose.SignJWT({
      htm: 'POST',
      htu: 'http://localhost/token',
      jti: 'jti-1',
    })
      .setProtectedHeader({ alg: 'ES256', typ: 'dpop+jwt', jwk })
      .setIssuedAt()
      .sign(clientKeyPair.privateKey);

    clientAssertion = await new jose.SignJWT({ iss: 'test-client' })
      .setProtectedHeader({ alg: 'ES256' })
      .sign(clientKeyPair.privateKey);
  });

  test('should exchange tokens in under 300ms', async () => {
    const start = performance.now();
    
    await useCase.execute({
      grantType: 'authorization_code',
      code: 'valid-code',
      redirectUri: 'http://localhost/cb',
      codeVerifier: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
      clientAssertionType: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      clientAssertion: clientAssertion,
      dpopHeader: dpopProof,
      method: 'POST',
      url: 'http://localhost/token'
    });

    const duration = performance.now() - start;
    console.log(`Token Exchange Duration: ${duration.toFixed(2)}ms`);
    
    expect(duration).toBeLessThan(300);
  });
});
