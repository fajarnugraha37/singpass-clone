import { UserInfoRepository } from '../domain/userinfo_repository';
import { ClientRegistry } from '../domain/client_registry';
import { SecurityAuditService } from '../domain/audit_service';

export interface LinkUserToClientInput {
  userId: string;
  clientId: string;
}

export interface LinkUserToClientOutput {
  success: boolean;
  message?: string;
}

export class LinkUserToClientUseCase {
  constructor(
    private userInfoRepository: UserInfoRepository,
    private clientRegistry: ClientRegistry,
    private auditService?: SecurityAuditService
  ) {}

  async execute(input: LinkUserToClientInput): Promise<LinkUserToClientOutput> {
    const { userId, clientId } = input;

    // 1. Validate Client
    const client = await this.clientRegistry.getClientConfig(clientId);
    if (!client) {
      throw new Error('Client not found');
    }

    // 2. Check for existing link
    const isLinked = await this.userInfoRepository.isUserLinkedToClient(userId, clientId);
    if (isLinked) {
      return { success: true, message: 'User already linked to this client' };
    }

    // 3. Enforce Staging account limits (FR-007)
    if (client.environment === 'Staging') {
      const currentCount = await this.userInfoRepository.countUsersByClient(clientId);
      if (currentCount >= 100) {
        await this.auditService?.logEvent({
          type: 'TEST_ACCOUNT_LIMIT_REACHED',
          severity: 'WARN',
          clientId,
          details: { userId, currentCount },
        });
        throw new Error('PRECONDITION_FAILED: Staging account limit (100) reached for this client');
      }
    }

    // 4. Create the link
    await this.userInfoRepository.linkUserToClient(userId, clientId);

    await this.auditService?.logEvent({
      type: 'USER_CLIENT_LINKED',
      severity: 'INFO',
      clientId,
      details: { userId },
    });

    return { success: true };
  }
}
