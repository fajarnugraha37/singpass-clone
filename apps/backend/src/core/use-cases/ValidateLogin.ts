import type { AuthSessionRepository } from '../domain/session';
import type { SecurityAuditService } from '../domain/audit_service';

export interface ValidateLoginInput {
  sessionId: string;
  username: string;
  password: string;
}

export interface ValidateLoginOutput {
  success: boolean;
  next_step?: '2fa';
  error?: string;
}

export class ValidateLoginUseCase {
  constructor(
    private authSessionRepository: AuthSessionRepository,
    private auditService: SecurityAuditService
  ) {}

  async execute(input: ValidateLoginInput): Promise<ValidateLoginOutput> {
    const { sessionId, username, password } = input;

    // 1. Retrieve session
    const session = await this.authSessionRepository.getById(sessionId);
    const now = new Date();

    if (!session || session.expiresAt < now) {
      await this.auditService.logEvent({
        eventType: 'LOGIN_FAILURE',
        severity: 'WARN',
        details: { reason: 'Session not found or expired', sessionId, username },
      });
      return { success: false, error: 'Session not found or expired' };
    }

    // 2. Validate credentials (Mock for MVP)
    // In a real app, this would use a UserRepository and PasswordHasher
    const isValid = username === 'S1234567A' && password === 'password123';

    if (!isValid) {
      await this.auditService.logEvent({
        eventType: 'LOGIN_FAILURE',
        severity: 'WARN',
        details: { reason: 'Invalid credentials', sessionId, username },
      });
      return { success: false, error: 'Invalid credentials' };
    }

    // 3. Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // 4. Update session
    session.status = 'PRIMARY_AUTH_SUCCESS';
    session.userId = username; // For now using username as userId
    session.otpCode = otpCode;
    session.updatedAt = now;

    await this.authSessionRepository.update(session);

    // 5. Log for dev purposes (as per research.md)
    console.info(`[2FA] Generated OTP for ${username}: ${otpCode}`);

    await this.auditService.logEvent({
      eventType: 'LOGIN_SUCCESS',
      severity: 'INFO',
      details: { sessionId, username, nextStep: '2fa' },
    });

    return {
      success: true,
      next_step: '2fa',
    };
  }
}
