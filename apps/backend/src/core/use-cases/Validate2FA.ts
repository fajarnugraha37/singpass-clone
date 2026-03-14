import type { AuthSessionRepository } from '../domain/session';
import type { SecurityAuditService } from '../domain/audit_service';
import type { GenerateAuthCodeUseCase } from './GenerateAuthCode';
import { sharedConfig } from '@vibe/shared/config';

export interface Validate2FAInput {
  sessionId: string;
  otp: string;
}

export interface Validate2FAOutput {
  success: boolean;
  redirect_uri?: string;
  error?: string;
  status?: string;
}

export class Validate2FAUseCase {
  constructor(
    private authSessionRepository: AuthSessionRepository,
    private auditService: SecurityAuditService,
    private generateAuthCodeUseCase: GenerateAuthCodeUseCase
  ) {}

  async execute(input: Validate2FAInput): Promise<Validate2FAOutput> {
    const { sessionId, otp } = input;

    // 1. Retrieve session
    const session = await this.authSessionRepository.getById(sessionId);
    const now = new Date();

    if (!session || session.expiresAt < now) {
      await this.auditService.logEvent({
        type: '2FA_FAILURE',
        severity: 'WARN',
        details: { reason: 'Session not found or expired', sessionId },
      });
      return { success: false, error: 'Session not found or expired' };
    }

    if (session.status === 'FAILED') {
      return { success: false, error: 'Authentication failed permanently', status: 'FAILED' };
    }

    // 2. Validate session status
    if (session.status !== 'PRIMARY_AUTH_SUCCESS' && session.status !== '2FA_PENDING') {
       await this.auditService.logEvent({
        type: '2FA_FAILURE',
        severity: 'WARN',
        details: { reason: 'Invalid session state for 2FA', sessionId, status: session.status },
      });
      return { success: false, error: 'Invalid session state' };
    }

    // 3. Validate OTP
    if (session.otpCode !== otp) {
      session.retryCount++;
      session.updatedAt = now;

      // Advance status to 2FA_PENDING if it was PRIMARY_AUTH_SUCCESS to track failed attempts
      if (session.status === 'PRIMARY_AUTH_SUCCESS') {
        session.status = '2FA_PENDING';
      }

      if (session.retryCount >= sharedConfig.SECURITY.MAX_AUTH_RETRIES) {
        session.status = 'FAILED';
        await this.authSessionRepository.update(session);

        await this.auditService.logEvent({
          type: 'AUTH_TERMINAL_FAILURE',
          severity: 'ERROR',
          details: { reason: 'Max OTP retries exceeded', sessionId, userId: session.userId },
        });

        return { success: false, error: 'Max retries exceeded', status: 'FAILED' };
      }

      await this.authSessionRepository.update(session);

      await this.auditService.logEvent({
        type: '2FA_FAILURE',
        severity: 'WARN',
        details: { reason: 'Invalid OTP', sessionId, userId: session.userId, retryCount: session.retryCount },
      });
      return { success: false, error: 'Invalid OTP' };
    }

    // 4. Update session on success
    session.status = 'COMPLETED';
    session.retryCount = 0;
    session.loa = 2;
    session.amr = ['pwd', 'otp-sms'];
    session.updatedAt = now;
    await this.authSessionRepository.update(session);

    await this.auditService.logEvent({
      type: '2FA_SUCCESS',
      severity: 'INFO',
      details: { sessionId, userId: session.userId },
    });

    // 5. Generate Authorization Code and Final Redirect URI
    try {
      const { redirectUri } = await this.generateAuthCodeUseCase.execute({ sessionId });
      return {
        success: true,
        redirect_uri: redirectUri,
      };
    } catch (error: any) {
      console.error('[2FA] Error generating auth code:', error);
      return { success: false, error: 'Final authorization failed' };
    }
  }
}
