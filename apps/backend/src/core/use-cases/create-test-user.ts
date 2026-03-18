import { UserInfoRepository } from '../domain/userinfo_repository';
import { UserData } from '../domain/userinfo_claims';
import { SecurityAuditService } from '../domain/audit_service';

export interface CreateTestUserInput {
  nric: string;
  name: string;
  email: string;
  uen: string;
}

export interface CreateTestUserOutput {
  user: UserData;
  warning?: string;
}

export class CreateTestUserUseCase {
  constructor(
    private userInfoRepository: UserInfoRepository,
    private auditService?: SecurityAuditService
  ) {}

  async execute(input: CreateTestUserInput): Promise<CreateTestUserOutput> {
    const { nric, name, email, uen } = input;

    // 1. Check existing count for this UEN (US4 Compliance - FR-008)
    const existingCount = await this.userInfoRepository.countUsersByUen(uen);
    let warning: string | undefined;

    if (existingCount >= 5) {
      warning = `Warning: Entity ${uen} has reached the soft limit of 5 test accounts. Further accounts may not be supported in production-like staging environments.`;
      
      await this.auditService?.logEvent({
        type: 'TEST_ACCOUNT_LIMIT_REACHED',
        severity: 'WARN',
        details: { uen, currentCount: existingCount },
      });
    }

    // 2. Create the user
    const user = await this.userInfoRepository.createUser({
      nric,
      name,
      email,
      uen,
    });

    await this.auditService?.logEvent({
      type: 'USER_CREATED',
      severity: 'INFO',
      details: { userId: user.id, nric, uen },
    });

    return {
      user,
      warning,
    };
  }
}
