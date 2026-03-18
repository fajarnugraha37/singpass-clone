import { expect, test, describe, beforeEach } from 'bun:test'
import { RegisterParUseCase } from '../../src/core/use-cases/register-par'
import type { CryptoService } from '../../src/core/domain/crypto_service'
import type { PARRepository } from '../../src/core/domain/par.types'
import type { SecurityAuditService } from '../../src/core/domain/audit_service'
import * as jose from 'jose'

describe('Singpass Compliance: Scope Enforcement', () => {
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

    const mockJWKSCacheService = {
      getClientSigningKey: async () => ({ kid: 'key-1', kty: 'RSA', n: 'test', e: 'AQAB' }),
    };

    mockClientRegistry = {
      getClientConfig: async (clientId: string) => ({
        clientId,
        clientName: 'Mock Client',
        appType: 'Login',
        redirectUris: ['https://client.example.com/cb'],
        allowedScopes: ['openid', 'uinfin', 'name'],
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
      mockJWKSCacheService as any,
      mockAuditService
    );
  });

  test('should succeed when requesting only authorized scopes', async () => {
    const input = {
      client_assertion: validJwt,
      client_id: 'mock-client-id',
      response_type: 'code',
      scope: 'openid uinfin',
      redirect_uri: 'https://client.example.com/cb',
      code_challenge: 'challenge',
      code_challenge_method: 'S256',
      state: 'a'.repeat(30),
      nonce: 'b'.repeat(30),
      purpose: 'Testing authorized scopes',
      authentication_context_type: 'APP_AUTHENTICATION_DEFAULT',
    } as any;

    const result = await useCase.execute(input);
    expect(result).toHaveProperty('request_uri');
  });

  test('should fail when requesting an unauthorized scope', async () => {
    const input = {
      client_assertion: validJwt,
      client_id: 'mock-client-id',
      response_type: 'code',
      scope: 'openid uinfin email', // 'email' is NOT in allowedScopes
      redirect_uri: 'https://client.example.com/cb',
      code_challenge: 'challenge',
      code_challenge_method: 'S256',
      state: 'a'.repeat(30),
      nonce: 'b'.repeat(30),
      purpose: 'Testing unauthorized scope',
      authentication_context_type: 'APP_AUTHENTICATION_DEFAULT',
    } as any;

    expect(useCase.execute(input)).rejects.toThrow('invalid_scope');
  });

  test('should fail when requesting multiple unauthorized scopes', async () => {
    const input = {
      client_assertion: validJwt,
      client_id: 'mock-client-id',
      response_type: 'code',
      scope: 'openid malicious_scope unauthorized',
      redirect_uri: 'https://client.example.com/cb',
      code_challenge: 'challenge',
      code_challenge_method: 'S256',
      state: 'a'.repeat(30),
      nonce: 'b'.repeat(30),
      purpose: 'Testing multiple unauthorized scopes',
      authentication_context_type: 'APP_AUTHENTICATION_DEFAULT',
    } as any;

    expect(useCase.execute(input)).rejects.toThrow('invalid_scope');
  });

  test('should handle empty allowed scopes gracefully', async () => {
    mockClientRegistry.getClientConfig = async (clientId: string) => ({
      clientId,
      appType: 'Login',
      redirectUris: ['https://client.example.com/cb'],
      allowedScopes: [], // Empty list
      isActive: true,
      jwks: { keys: [{ kid: 'key-1' }] },
    });

    const input = {
      client_assertion: validJwt,
      client_id: 'mock-client-id',
      response_type: 'code',
      scope: 'openid',
      redirect_uri: 'https://client.example.com/cb',
      code_challenge: 'challenge',
      code_challenge_method: 'S256',
      state: 'a'.repeat(30),
      nonce: 'b'.repeat(30),
      purpose: 'Testing empty allowed scopes',
      authentication_context_type: 'APP_AUTHENTICATION_DEFAULT',
    } as any;

    expect(useCase.execute(input)).rejects.toThrow('invalid_scope');
  });
});
