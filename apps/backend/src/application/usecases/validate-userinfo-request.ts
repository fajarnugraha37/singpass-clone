import { UserInfoRepository, AccessTokenData } from '../../core/domain/userinfo_repository';
import { DPoPValidator } from '../../core/utils/dpop_validator';

/**
 * Validates the Userinfo request by checking the Access Token and DPoP proof.
 */
export class ValidateUserInfoRequestUseCase {
  constructor(
    private repository: UserInfoRepository,
    private dpopValidator: DPoPValidator
  ) {}

  async execute(
    token: string, 
    dpopProof: string, 
    method: string, 
    url: string
  ): Promise<AccessTokenData> {
    // 1. Retrieve Access Token from repository
    const tokenData = await this.repository.getAccessToken(token);
    if (!tokenData) {
      throw new Error('invalid_token');
    }

    // 2. Check expiration
    if (tokenData.expiresAt < new Date()) {
      throw new Error('invalid_token');
    }

    // 3. Validate DPoP Proof and binding
    const dpopResult = await this.dpopValidator.validate(tokenData.clientId, {
      proof: dpopProof,
      method,
      url,
      expectedJkt: tokenData.dpopJkt,
    });

    if (!dpopResult.isValid) {
      throw new Error(`invalid_dpop_proof: ${dpopResult.error}`);
    }

    return tokenData;
  }
}
