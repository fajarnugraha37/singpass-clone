import { expect, test, describe, beforeEach, spyOn } from 'bun:test'
import { InitiateAuthSessionUseCase } from '../../../src/core/use-cases/InitiateAuthSession'
import type { AuthSessionRepository } from '../../../src/core/domain/session'
import type { PARRepository } from '../../../src/core/domain/par.types'
import type { SecurityAuditService } from '../../../src/core/domain/audit_service'
import type { ClientRegistry } from '../../../src/core/domain/client_registry'

describe('InitiateAuthSessionUseCase', () => {
  let mockAuthSessionRepository: AuthSessionRepository;
  let mockPARRepository: PARRepository;
  let mockAuditService: SecurityAuditService;
  let mockClientRegistry: ClientRegistry;
  let useCase: InitiateAuthSessionUseCase;

  beforeEach(() => {
    mockAuthSessionRepository = {
      save: async () => {},
      getById: async () => null,
      update: async () => {},
      delete: async () => {},
    } as any;

    mockPARRepository = {
      getByRequestUri: async (uri: string) => {
        if (uri === 'urn:ietf:params:oauth:request_uri:valid') {
          return {
            clientId: 'client-123',
            requestUri: uri,
            payload: { state: 'state-123' },
            expiresAt: new Date(Date.now() + 300000),
          };
        }
        return null;
      },
    } as any;

    mockAuditService = {
      logEvent: async () => {},
    } as any;

    mockClientRegistry = {
      getClientConfig: async (clientId: string) => ({
        clientId,
        clientName: 'Test Client',
        appType: 'Login',
        isActive: true,
        allowedScopes: ['openid'],
        redirectUris: ['https://example.com/cb'],
        uen: 'UEN123',
        hasAcceptedAgreement: true,
      }),
    } as any;

    useCase = new InitiateAuthSessionUseCase(
      mockAuthSessionRepository,
      mockPARRepository,
      mockAuditService,
      mockClientRegistry
    );
  });

  test('should successfully initiate a session with valid PAR request_uri', async () => {
    const result = await useCase.execute({
      clientId: 'client-123',
      requestUri: 'urn:ietf:params:oauth:request_uri:valid',
    });

    expect(result).toHaveProperty('sessionId');
    expect(result.sessionId).toBeDefined();
    expect(result).toHaveProperty('redirectUri', '/login');
  });

  test('should throw error if PAR request_uri is invalid or expired', async () => {
    expect(useCase.execute({
      clientId: 'client-123',
      requestUri: 'urn:ietf:params:oauth:request_uri:invalid',
    })).rejects.toThrow('Invalid or expired request_uri');
  });

  test('should throw error if clientId does not match PAR request', async () => {
    expect(useCase.execute({
      clientId: 'wrong-client',
      requestUri: 'urn:ietf:params:oauth:request_uri:valid',
    })).rejects.toThrow('client_id mismatch');
  });
});
