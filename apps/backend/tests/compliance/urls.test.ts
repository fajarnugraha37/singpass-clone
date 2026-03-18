import { expect, test, describe, beforeEach } from 'bun:test'
import { RegisterParUseCase } from '../../src/core/use-cases/register-par'
import type { CryptoService } from '../../src/core/domain/crypto_service'
import type { PARRepository } from '../../src/core/domain/par.types'
import type { SecurityAuditService } from '../../src/core/domain/audit_service'
import * as jose from 'jose'

describe('Singpass Compliance: URL Safety Enforcement', () => {
  let mockCryptoService: CryptoService;
  let mockPARRepository: PARRepository;
  let mockClientRegistry: any;
  let mockAuditService: SecurityAuditService;
  let useCase: RegisterParUseCase;
  let validJwt: string;

  beforeEach(async () => {
    const secret = new TextEncoder().encode('secret');
    validJwt = await new jose.SignJWT({ jti: 'test-jti' })
      .setProtectedHeader({ alg: 'HS256' })
      .sign(secret);

    mockCryptoService = {
      validateClientAssertion: async () => true,
      calculateThumbprint: async () => 'test-jkt',
      generateDPoPNonce: async () => 'test-nonce',
      validateDPoPNonce: async () => true,
    } as any;

    mockPARRepository = {
      save: async () => {},
      isJtiConsumed: async () => false,
      consumeJti: async () => {},
    } as any;

    mockAuditService = {
      logEvent: async () => {},
    } as any;

    const mockDPoPValidator = {
      validate: async () => ({ isValid: true, jkt: 'test-jkt' })
    };

    mockClientRegistry = {
      getClientConfig: async (clientId: string) => ({
        clientId,
        clientName: 'Mock Client',
        appType: 'Login',
        redirectUris: ['https://client.example.com/cb', 'http://localhost:3000/cb'],
        allowedScopes: ['openid'],
        isActive: true,
        uen: 'UEN123',
        hasAcceptedAgreement: true,
        jwks: { keys: [{ kid: 'key-1' }] },
      }),
    };

    useCase = new RegisterParUseCase(
      mockCryptoService,
      mockPARRepository,
      mockClientRegistry,
      mockDPoPValidator as any,
      mockAuditService
    );
  });

  test('should succeed with HTTPS URL', async () => {
    const input = {
      ...getBaseInput(),
      redirect_uri: 'https://client.example.com/cb',
    } as any;

    const result = await useCase.execute(input);
    expect(result).toHaveProperty('request_uri');
  });

  test('should fail with IP-based URL (IPv4)', async () => {
    const input = {
      ...getBaseInput(),
      redirect_uri: 'https://123.123.1.1/callback',
    } as any;

    expect(useCase.execute(input)).rejects.toThrow('redirect_uri is insecure or contains an IP address');
  });

  test('should fail with HTTP URL in non-dev environment', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    
    try {
      const input = {
        ...getBaseInput(),
        redirect_uri: 'http://client.example.com/cb',
      } as any;

      expect(useCase.execute(input)).rejects.toThrow('redirect_uri is insecure or contains an IP address');
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  test('should succeed with http://localhost in non-production environment', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    try {
      const input = {
        ...getBaseInput(),
        redirect_uri: 'http://localhost:3000/cb',
      } as any;

      const result = await useCase.execute(input);
      expect(result).toHaveProperty('request_uri');
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  test('should fail with http://localhost in production environment', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    
    try {
      const input = {
        ...getBaseInput(),
        redirect_uri: 'http://localhost:3000/cb',
      } as any;

      expect(useCase.execute(input)).rejects.toThrow('redirect_uri is insecure or contains an IP address');
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  function getBaseInput() {
    return {
      client_assertion: validJwt,
      client_id: 'mock-client-id',
      response_type: 'code',
      scope: 'openid',
      redirect_uri: 'https://client.example.com/cb',
      code_challenge: 'challenge',
      code_challenge_method: 'S256',
      state: 'a'.repeat(30),
      nonce: 'b'.repeat(30),
      purpose: 'Testing URL safety',
      authentication_context_type: 'APP_AUTHENTICATION_DEFAULT',
    };
  }
});
