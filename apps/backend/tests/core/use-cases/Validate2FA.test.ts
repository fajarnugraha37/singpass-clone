import { expect, test, describe, beforeEach } from 'bun:test'
import { Validate2FAUseCase } from '../../../src/core/use-cases/Validate2FA'
import type { AuthSessionRepository } from '../../../src/core/domain/session'
import type { SecurityAuditService } from '../../../src/core/domain/audit_service'
import type { GenerateAuthCodeUseCase } from '../../../src/core/use-cases/GenerateAuthCode'

describe('Validate2FAUseCase', () => {
  let mockAuthSessionRepository: AuthSessionRepository;
  let mockAuditService: SecurityAuditService;
  let mockGenerateAuthCodeUseCase: GenerateAuthCodeUseCase;
  let useCase: Validate2FAUseCase;

  beforeEach(() => {
    mockAuthSessionRepository = {
      save: async () => {},
      getById: async (id: string) => {
        if (id === 'valid-session-id') {
          return {
            id,
            clientId: 'client-123',
            status: 'PRIMARY_AUTH_SUCCESS',
            otpCode: '123456',
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

    mockGenerateAuthCodeUseCase = {
      execute: async () => ({
        code: 'mock-code',
        redirectUri: 'https://client.example.com/cb?code=mock-code',
      }),
    } as any;

    useCase = new Validate2FAUseCase(
      mockAuthSessionRepository,
      mockAuditService,
      mockGenerateAuthCodeUseCase
    );
  });

  test('should successfully validate OTP and return success', async () => {
    const result = await useCase.execute({
      sessionId: 'valid-session-id',
      otp: '123456',
    });

    expect(result).toHaveProperty('success', true);
    expect(result).toHaveProperty('redirect_uri');
  });

  test('should fail for invalid OTP', async () => {
    const result = await useCase.execute({
      sessionId: 'valid-session-id',
      otp: 'wrong-otp',
    });

    expect(result).toHaveProperty('success', false);
    expect(result).toHaveProperty('error', 'Invalid OTP');
  });

  test('should fail for invalid session', async () => {
    const result = await useCase.execute({
      sessionId: 'invalid-session-id',
      otp: '123456',
    });

    expect(result).toHaveProperty('success', false);
    expect(result).toHaveProperty('error', 'Session not found or expired');
  });
});
