import type { AuthSessionRepository } from '../domain/session';
import type { SecurityAuditService } from '../domain/audit_service';
import type { UserInfoRepository } from '../domain/userinfo_repository';
import { sharedConfig } from '@vibe/shared/config';

export interface ValidateLoginInput {
  sessionId: string;
  username: string;
  password: string;
}

export interface ValidateLoginOutput {
  success: boolean;
  next_step?: '2fa';
  error?: string;
  status?: string;
}

export class ValidateLoginUseCase {
  constructor(
    private authSessionRepository: AuthSessionRepository,
    private auditService: SecurityAuditService,
    private userRepository: UserInfoRepository
  ) {}

  async execute(input: ValidateLoginInput): Promise<ValidateLoginOutput> {
    const { sessionId, username, password } = input;

    // 1. Retrieve session
    const session = await this.authSessionRepository.getById(sessionId);
    const now = new Date();

    if (!session || session.expiresAt < now) {
      await this.auditService.logEvent({
        type: 'LOGIN_FAILURE',
        severity: 'WARN',
        details: { reason: 'Session not found or expired', sessionId, username },
      });
      return { success: false, error: 'Session not found or expired' };
    }

    if (session.status === 'FAILED') {
      return { success: false, error: 'Authentication failed permanently', status: 'FAILED' };
    }

    // 2. Validate credentials against Database
    const user = await this?.userRepository?.getUserByNric(username);
    let isValid = false;

    if (user && user.passwordHash) {
      isValid = await Bun.password.verify(password, user.passwordHash);
    }

    if (!isValid) {
      session.retryCount++;
      session.updatedAt = now;

      if (session.retryCount >= sharedConfig.SECURITY.MAX_AUTH_RETRIES) {
        session.status = 'FAILED';
        await this.authSessionRepository.update(session);

        await this.auditService.logEvent({
          type: 'AUTH_TERMINAL_FAILURE',
          severity: 'ERROR',
          details: { reason: 'Max password retries exceeded', sessionId, username },
        });

        return { success: false, error: 'Max retries exceeded', status: 'FAILED' };
      }

      await this.authSessionRepository.update(session);

      await this.auditService.logEvent({
        type: 'LOGIN_FAILURE',
        severity: 'WARN',
        details: { reason: 'Invalid credentials', sessionId, username, retryCount: session.retryCount },
      });
      return { success: false, error: 'Invalid credentials' };
    }

    // 3. Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // 4. Update session
    session.status = 'PRIMARY_AUTH_SUCCESS';
    session.userId = user!.id || (user as any).userId; // Use UUID from database
    session.otpCode = otpCode;
    session.retryCount = 0; // Reset on success? Requirement doesn't specify, but good practice.
    session.loa = 1;
    session.amr = ['pwd'];
    session.updatedAt = now;

    await this.authSessionRepository.update(session);

    // 5. Log for dev purposes (as per research.md)
    if (process.env.NODE_ENV !== 'production') {
      console.info(`[2FA] Generated OTP for ${username}: ${otpCode}`);
    }

    await this.auditService.logEvent({
      type: 'LOGIN_SUCCESS',
      severity: 'INFO',
      details: { sessionId, username, nextStep: '2fa' },
    });

    return {
      success: true,
      next_step: '2fa',
    };
  }
}
