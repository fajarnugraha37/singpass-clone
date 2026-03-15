import type { AuthSessionRepository, AuthSession } from '../domain/session';
import type { PARRepository } from '../domain/par.types';
import type { SecurityAuditService } from '../domain/audit_service';

export interface InitiateAuthSessionInput {
  clientId: string;
  requestUri: string;
}

export interface InitiateAuthSessionOutput {
  sessionId: string;
  redirectUri: string;
}

export class InitiateAuthSessionUseCase {
  constructor(
    private authSessionRepository: AuthSessionRepository,
    private parRepository: PARRepository,
    private auditService: SecurityAuditService
  ) {}

  async execute(input: InitiateAuthSessionInput): Promise<InitiateAuthSessionOutput> {
    const { clientId, requestUri } = input;

    // 1. Retrieve and validate PAR request
    const parRequest = await this.parRepository.getByRequestUri(requestUri);
    if (!parRequest) {
      await this.auditService.logEvent({
        type: 'AUTH_INITIATION_FAILURE',
        severity: 'WARN',
        details: { reason: 'Invalid or expired request_uri', requestUri, clientId },
      });
      throw new Error('Invalid or expired request_uri');
    }

    // 2. Validate client_id matches
    if (parRequest.clientId !== clientId) {
      await this.auditService.logEvent({
        type: 'AUTH_INITIATION_FAILURE',
        severity: 'WARN',
        details: { reason: 'client_id mismatch', requestUri, clientId, parClientId: parRequest.clientId },
      });
      throw new Error('client_id mismatch');
    }

    // 3. Create a new Auth Session
    const sessionId = crypto.randomUUID();
    const now = new Date();
    
    const session: AuthSession = {
      id: sessionId,
      parRequestUri: requestUri,
      clientId: clientId,
      status: 'INITIATED',
      retryCount: 0,
      loa: 1,
      amr: [],
      expiresAt: parRequest.expiresAt,
      createdAt: now,
      updatedAt: now,
    };

    await this.authSessionRepository.save(session);

    await this.auditService.logEvent({
      type: 'AUTH_INITIATION_SUCCESS',
      severity: 'INFO',
      details: { sessionId, clientId, requestUri },
    });

    return {
      sessionId,
      redirectUri: '/login',
    };
  }
}
