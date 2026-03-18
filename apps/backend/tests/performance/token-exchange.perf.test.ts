import { expect, test, describe, beforeAll } from 'bun:test';
import { TokenExchangeUseCase } from '../../src/core/use-cases/token-exchange';
import { ClientAuthenticationService } from '../../src/core/application/services/client-auth.service';
import { TokenService } from '../../src/core/application/services/token.service';
import { DPoPValidator } from '../../src/core/utils/dpop_validator';
import * as jose from 'jose';
import { JWKSCacheService } from 'src/infra/adapters/jwks_cache';

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
  generateDPoPNonce: async () => 'mock-nonce',
  validateDPoPNonce: async () => true,
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
    const mockClientRegistry: any = {
      getClientConfig: async (clientId: string) => ({
        clientId: 'test-client',
        clientName: 'Test Client',
        redirectUris: ['http://localhost/cb'],
        jwks: { keys: [
          {
            kty: 'EC',
            crv: 'P-256',
            x: 'f83OJ3D2xF1Bg8vub9tLe1gHMzV76e8Tus9uPHvRVEU',
            y: 'x_FEzRu9m36HLN_tue659LNpXW6pCyStikYjKIWI5a0',
            kid: 'mock-client-key-1',
            use: 'sig',
            alg: 'ES256',
          },
          {
            kty: 'EC',
            crv: 'P-256',
            x: '1HrSJLEHsUI8f3TCMdiFVtDyXOtmJeu0x2b0MT-a1vI',
            y: 'cRC2KiCF4oQxfiZ39vVBMp5ng2rPEpYSSmNI7brbTiQ',
            kid: 'mock-client-enc-key',
            use: 'enc',
            alg: 'ECDH-ES+A256KW',
          }
        ] }
      })
    };
    const jwksCacheService = new JWKSCacheService();
    const clientAuthService = new ClientAuthenticationService(mockCryptoService, mockClientRegistry, jwksCacheService);
    const tokenService = new TokenService(mockCryptoService, mockClientRegistry, jwksCacheService);
    const dpopValidator = new DPoPValidator(mockJtiStore);
    const mockUserInfoRepo: any = {
      getUserById: async () => ({ id: 'user-123', nric: 'S1234567A', name: 'Test User' }),
    };
    useCase = new TokenExchangeUseCase(
      clientAuthService,
      tokenService,
      mockAuthCodeRepo,
      mockTokenRepo,
      dpopValidator,
      mockUserInfoRepo,
      mockCryptoService,
      'https://issuer.example.com'
    );

    const clientKeyPair = await jose.generateKeyPair('ES256');
    const jwk = await jose.exportJWK(clientKeyPair.publicKey);
    const jkt = await jose.calculateJwkThumbprint(jwk);

    mockAuthCodeRepo.getByCode = async () => ({
      clientId: 'test-client',
      redirectUri: 'http://localhost/cb',
      codeChallenge: 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
      dpopJkt: jkt,
      scope: 'openid',
      userId: 'user-123',
      loa: 2,
      amr: ['pwd', 'otp-sms'],
      expiresAt: new Date(Date.now() + 10000),
    });

    dpopProof = await new jose.SignJWT({
      htm: 'POST',
      htu: 'http://localhost/token',
      jti: 'jti-1',
      nonce: 'mock-nonce',
    })
      .setProtectedHeader({ alg: 'ES256', typ: 'dpop+jwt', jwk })
      .setIssuedAt()
      .setExpirationTime('120s')
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
