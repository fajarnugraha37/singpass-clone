import { expect, test, describe, beforeEach } from 'bun:test'
import { RegisterParUseCase } from '../../src/core/use-cases/register-par'
import { InitiateAuthSessionUseCase } from '../../src/core/use-cases/InitiateAuthSession'
import { ClientAuthenticationService } from '../../src/core/application/services/client-auth.service'
import type { CryptoService } from '../../src/core/domain/crypto_service'
import type { PARRepository } from '../../src/core/domain/par.types'
import type { SecurityAuditService } from '../../src/core/domain/audit_service'
import * as jose from 'jose'

describe('Singpass Compliance: Client Activation Management', () => {
  let mockCryptoService: CryptoService;
  let mockPARRepository: PARRepository;
  let mockClientRegistry: any;
  let mockAuditService: SecurityAuditService;
  let mockAuthSessionRepository: any;
  let validJwt: string;

  beforeEach(async () => {
    const secret = new TextEncoder().encode('secret');
    validJwt = await new jose.SignJWT({ jti: 'test-jti', iss: 'mock-client-id' })
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
      getByRequestUri: async () => ({
        clientId: 'mock-client-id',
        requestUri: 'uri-123',
        expiresAt: new Date(Date.now() + 300000),
        purpose: 'test'
      })
    } as any;

    mockAuditService = {
      logEvent: async () => {},
    } as any;

    mockAuthSessionRepository = {
      save: async () => {},
    };

    mockClientRegistry = {
      getClientConfig: async (clientId: string) => ({
        clientId,
        isActive: clientId !== 'deactivated-client',
        allowedScopes: ['openid'],
        redirectUris: ['https://client.example.com/cb'],
        jwks: { keys: [{ kid: 'key-1', use: 'sig' }] },
      }),
    };
  });

  describe('RegisterParUseCase', () => {
    test('should fail when client is deactivated', async () => {
      const mockJWKSCacheService = {
        getClientSigningKey: async () => ({ kid: 'key-1', kty: 'RSA', n: 'test', e: 'AQAB' }),
      };

      const useCase = new RegisterParUseCase(
        mockCryptoService,
        mockPARRepository,
        mockClientRegistry,
        { validate: async () => ({ isValid: true }) } as any,
        mockJWKSCacheService as any,
        mockAuditService
      );

      const input = {
        client_assertion: validJwt,
        client_id: 'deactivated-client',
        response_type: 'code',
        scope: 'openid',
        redirect_uri: 'https://client.example.com/cb',
        code_challenge: 'challenge',
        code_challenge_method: 'S256',
        state: 'a'.repeat(30),
        nonce: 'b'.repeat(30),
        purpose: 'Testing deactivated client',
      } as any;

      expect(useCase.execute(input)).rejects.toThrow('unauthorized_client');
    });
  });

  describe('InitiateAuthSessionUseCase', () => {
    test('should fail when client is deactivated', async () => {
      // Ensure mock PAR has same client ID
      mockPARRepository.getByRequestUri = async () => ({
        clientId: 'deactivated-client',
        requestUri: 'uri-123',
        expiresAt: new Date(Date.now() + 300000),
        purpose: 'test'
      });

      const useCase = new InitiateAuthSessionUseCase(
        mockAuthSessionRepository,
        mockPARRepository,
        mockAuditService,
        mockClientRegistry
      );

      expect(useCase.execute({
        clientId: 'deactivated-client',
        requestUri: 'uri-123'
      })).rejects.toThrow('unauthorized_client');
    });
  });

  describe('ClientAuthenticationService (Token Endpoint)', () => {
    test('should fail when client is deactivated during token exchange', async () => {
      // Create a JWT for deactivated client
      const secret = new TextEncoder().encode('secret');
      const deactivatedJwt = await new jose.SignJWT({ jti: 'test-jti', iss: 'deactivated-client' })
        .setProtectedHeader({ alg: 'HS256' })
        .sign(secret);

      const service = new ClientAuthenticationService(
        mockCryptoService,
        mockClientRegistry
      );

      expect(service.authenticate(deactivatedJwt, 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer'))
        .rejects.toThrow(); // FapiError wraps it
    });
  });
});
