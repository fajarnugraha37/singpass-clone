import { expect, test, describe, beforeEach } from 'bun:test'
import { GenerateAuthCodeUseCase } from '../../../src/core/use-cases/GenerateAuthCode'
import type { AuthorizationCodeRepository } from '../../../src/core/domain/authorizationCode'
import type { AuthSessionRepository } from '../../../src/core/domain/session'
import type { PARRepository } from '../../../src/core/domain/par.types'
import type { SecurityAuditService } from '../../../src/core/domain/audit_service'

describe('GenerateAuthCodeUseCase', () => {
  let mockAuthCodeRepository: AuthorizationCodeRepository;
  let mockAuthSessionRepository: AuthSessionRepository;
  let mockPARRepository: PARRepository;
  let mockAuditService: SecurityAuditService;
  let useCase: GenerateAuthCodeUseCase;

  beforeEach(() => {
    mockAuthCodeRepository = {
      save: async () => {},
      getByCode: async () => null,
      markAsUsed: async () => {},
    } as any;

    mockAuthSessionRepository = {
      getById: async (id: string) => {
        if (id === 'valid-session-id') {
          return {
            id,
            userId: 'user-123',
            clientId: 'client-123',
            parRequestUri: 'urn:ietf:params:oauth:request_uri:123',
            status: 'COMPLETED',
            expiresAt: new Date(Date.now() + 300000),
          };
        }
        return null;
      },
      update: async () => {},
    } as any;

    mockPARRepository = {
      getByRequestUri: async () => ({
        payload: {
          code_challenge: 'challenge-123',
          code_challenge_method: 'S256',
          state: 'state-123',
          nonce: 'nonce-123',
          redirect_uri: 'https://client.example.com/callback'
        },
        dpopJkt: 'jkt-123'
      }),
    } as any;

    mockAuditService = {
      logEvent: async () => {},
    } as any;

    useCase = new GenerateAuthCodeUseCase(
      mockAuthCodeRepository,
      mockAuthSessionRepository,
      mockPARRepository,
      mockAuditService
    );
  });

  test('should successfully generate an authorization code and return redirect URI', async () => {
    const result = await useCase.execute({
      sessionId: 'valid-session-id'
    });

    expect(result).toHaveProperty('code');
    expect(result).toHaveProperty('redirectUri');
    expect(result.redirectUri).toContain('code=' + result.code);
    expect(result.redirectUri).toContain('state=state-123');
    expect(result.redirectUri).toContain('https://client.example.com/callback');
  });

  test('should throw error if session is not found', async () => {
    expect(useCase.execute({
      sessionId: 'invalid-session-id'
    })).rejects.toThrow('Session not found or expired');
  });

  test('should throw error if session is not in COMPLETED status', async () => {
    mockAuthSessionRepository.getById = async () => ({
      status: 'INITIATED',
      expiresAt: new Date(Date.now() + 300000),
    } as any);

    expect(useCase.execute({
      sessionId: 'valid-session-id'
    })).rejects.toThrow('Authentication not completed');
  });
});
