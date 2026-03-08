import type { AuthSessionRepository } from '../domain/session';
import type { SecurityAuditService } from '../domain/audit_service';

export interface Validate2FAInput {
  sessionId: string;
  otp: string;
}

export interface Validate2FAOutput {
  success: boolean;
  redirect_uri?: string;
  error?: string;
}

export class Validate2FAUseCase {
  constructor(
    private authSessionRepository: AuthSessionRepository,
    private auditService: SecurityAuditService
  ) {}

  async execute(input: Validate2FAInput): Promise<Validate2FAOutput> {
    const { sessionId, otp } = input;

    // 1. Retrieve session
    const session = await this.authSessionRepository.getById(sessionId);
    const now = new Date();

    if (!session || session.expiresAt < now) {
      await this.auditService.logEvent({
        eventType: '2FA_FAILURE',
        severity: 'WARN',
        details: { reason: 'Session not found or expired', sessionId },
      });
      return { success: false, error: 'Session not found or expired' };
    }

    // 2. Validate session status
    if (session.status !== 'PRIMARY_AUTH_SUCCESS' && session.status !== '2FA_PENDING') {
       await this.auditService.logEvent({
        eventType: '2FA_FAILURE',
        severity: 'WARN',
        details: { reason: 'Invalid session state for 2FA', sessionId, status: session.status },
      });
      return { success: false, error: 'Invalid session state' };
    }

    // 3. Validate OTP
    if (session.otpCode !== otp) {
      // Advance status to 2FA_PENDING if it was PRIMARY_AUTH_SUCCESS to track failed attempts
      if (session.status === 'PRIMARY_AUTH_SUCCESS') {
        session.status = '2FA_PENDING';
        await this.authSessionRepository.update(session);
      }

      await this.auditService.logEvent({
        eventType: '2FA_FAILURE',
        severity: 'WARN',
        details: { reason: 'Invalid OTP', sessionId, userId: session.userId },
      });
      return { success: false, error: 'Invalid OTP' };
    }

    // 4. Update session on success
    session.status = 'COMPLETED';
    session.updatedAt = now;
    await this.authSessionRepository.update(session);

    await this.auditService.logEvent({
      eventType: '2FA_SUCCESS',
      severity: 'INFO',
      details: { sessionId, userId: session.userId },
    });

    // TODO: T026 - OIDC Code Generation should be integrated here or return a placeholder
    return {
      success: true,
      redirect_uri: '/placeholder-redirect', // To be updated in T026
    };
  }
}
