import { expect, test, describe, beforeEach } from 'bun:test'
import { ValidateLoginUseCase } from '../../../src/core/use-cases/ValidateLogin'
import type { AuthSessionRepository } from '../../../src/core/domain/session'
import type { SecurityAuditService } from '../../../src/core/domain/audit_service'

describe('ValidateLoginUseCase', () => {
  let mockAuthSessionRepository: AuthSessionRepository;
  let mockAuditService: SecurityAuditService;
  let useCase: ValidateLoginUseCase;

  beforeEach(() => {
    mockAuthSessionRepository = {
      save: async () => {},
      getById: async (id: string) => {
        if (id === 'valid-session-id') {
          return {
            id,
            clientId: 'client-123',
            status: 'INITIATED',
            expiresAt: new Date(Date.now() + 300000),
          };
        }
        return null;
      },
      update: async () => {},
      delete: async () => {},
    } as any;

    mockAuditService = {
      logEvent: async () => {},
    } as any;

    useCase = new ValidateLoginUseCase(
      mockAuthSessionRepository,
      mockAuditService
    );
  });

  test('should successfully validate login and update session with OTP', async () => {
    const result = await useCase.execute({
      sessionId: 'valid-session-id',
      username: 'S1234567A', // Mock user
      password: 'password123',
    });

    expect(result).toHaveProperty('success', true);
    expect(result).toHaveProperty('next_step', '2fa');
  });

  test('should fail for invalid session', async () => {
    const result = await useCase.execute({
      sessionId: 'invalid-session-id',
      username: 'S1234567A',
      password: 'password123',
    });

    expect(result).toHaveProperty('success', false);
    expect(result).toHaveProperty('error', 'Session not found or expired');
  });

  test('should fail for invalid credentials', async () => {
    const result = await useCase.execute({
      sessionId: 'valid-session-id',
      username: 'S1234567A',
      password: 'wrong-password',
    });

    expect(result).toHaveProperty('success', false);
    expect(result).toHaveProperty('error', 'Invalid credentials');
  });
});
