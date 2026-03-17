import { UserInfoRepository, AccessTokenData } from '../../core/domain/userinfo_repository';
import { DPoPValidator } from '../../core/utils/dpop_validator';
import { CryptoService } from '../../core/domain/crypto_service';
import * as jose from 'jose';
import { FapiErrors } from '../../infra/middleware/fapi-error';

/**
 * Validates the Userinfo request by checking the Access Token and DPoP proof.
 */
export class ValidateUserInfoRequestUseCase {
  constructor(
    private repository: UserInfoRepository,
    private dpopValidator: DPoPValidator,
    private cryptoService: CryptoService
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
    const decodedProof = jose.decodeJwt(dpopProof);
    const proofNonce = decodedProof.nonce as string;

    if (!proofNonce) {
      const freshNonce = await this.cryptoService.generateDPoPNonce(tokenData.clientId);
      throw FapiErrors.useDpopNonce(freshNonce, 'Missing or invalid DPoP nonce');
    }

    const isNonceValid = await this.cryptoService.validateDPoPNonce(proofNonce, tokenData.clientId);
    if (!isNonceValid) {
      const freshNonce = await this.cryptoService.generateDPoPNonce(tokenData.clientId);
      throw FapiErrors.useDpopNonce(freshNonce, 'Missing or invalid DPoP nonce');
    }

    const dpopResult = await this.dpopValidator.validate(tokenData.clientId, {
      proof: dpopProof,
      method,
      url,
      expectedJkt: tokenData.dpopJkt,
      expectedNonce: proofNonce,
    });

    if (!dpopResult.isValid) {
      if (dpopResult.error === 'use_dpop_nonce') {
        const freshNonce = await this.cryptoService.generateDPoPNonce(tokenData.clientId);
        throw FapiErrors.useDpopNonce(freshNonce, 'Missing or invalid DPoP nonce');
      }
      throw new Error(`invalid_dpop_proof: ${dpopResult.error}`);
    }

    return tokenData;
  }
}
