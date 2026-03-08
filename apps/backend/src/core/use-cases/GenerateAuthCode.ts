import type { AuthorizationCodeRepository, AuthorizationCode } from '../domain/authorizationCode';
import type { AuthSessionRepository } from '../domain/session';
import type { PARRepository } from '../domain/par.types';
import type { SecurityAuditService } from '../domain/audit_service';

export interface GenerateAuthCodeInput {
  sessionId: string;
}

export interface GenerateAuthCodeOutput {
  code: string;
  redirectUri: string;
}

export class GenerateAuthCodeUseCase {
  constructor(
    private authCodeRepository: AuthorizationCodeRepository,
    private authSessionRepository: AuthSessionRepository,
    private parRepository: PARRepository,
    private auditService: SecurityAuditService
  ) {}

  async execute(input: GenerateAuthCodeInput): Promise<GenerateAuthCodeOutput> {
    const { sessionId } = input;

    // 1. Validate session
    const session = await this.authSessionRepository.getById(sessionId);
    const now = new Date();

    if (!session || session.expiresAt < now) {
       await this.auditService.logEvent({
        type: 'AUTH_CODE_GENERATION_FAILURE',
        severity: 'WARN',
        details: { reason: 'Session not found or expired', sessionId },
      });
      throw new Error('Session not found or expired');
    }

    if (session.status !== 'COMPLETED') {
       await this.auditService.logEvent({
        type: 'AUTH_CODE_GENERATION_FAILURE',
        severity: 'WARN',
        details: { reason: 'Authentication not completed', sessionId, status: session.status },
      });
      throw new Error('Authentication not completed');
    }

    // 2. Retrieve PAR request for OIDC parameters
    const parRequest = await this.parRepository.getByRequestUri(session.parRequestUri);
    if (!parRequest) {
      throw new Error('Original authorization request not found');
    }

    const { payload, dpopJkt } = parRequest;

    // 3. Generate Authorization Code
    const code = crypto.randomUUID(); // Secure enough for MVP
    const expiresAt = new Date(Date.now() + 60000); // 1 minute expiry

    const authCode: AuthorizationCode = {
      code,
      userId: session.userId!,
      clientId: session.clientId,
      codeChallenge: payload.code_challenge,
      dpopJkt: dpopJkt!,
      nonce: payload.nonce,
      redirectUri: payload.redirect_uri,
      expiresAt,
      used: false,
      createdAt: now,
    };

    await this.authCodeRepository.save(authCode);

    // 4. Construct Redirect URI
    const redirectUrl = new URL(payload.redirect_uri);
    redirectUrl.searchParams.set('code', code);
    if (payload.state) {
      redirectUrl.searchParams.set('state', payload.state);
    }

    await this.auditService.logEvent({
      type: 'AUTH_CODE_GENERATED',
      severity: 'INFO',
      details: { sessionId, userId: session.userId, clientId: session.clientId },
    });

    return {
      code,
      redirectUri: redirectUrl.toString(),
    };
  }
}
