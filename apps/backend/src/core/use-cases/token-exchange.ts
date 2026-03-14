import { ClientAuthenticationService } from '../application/services/client-auth.service';
import { TokenService } from '../application/services/token.service';
import { AuthorizationCodeRepository } from '../domain/authorizationCode';
import { DrizzleTokenRepository } from '../../infra/adapters/db/drizzle_token_repository';
import { DPoPValidator } from '../utils/dpop_validator';
import { validatePKCE } from '../utils/pkce';
import { FapiErrors } from '../../infra/middleware/fapi-error';
import type { TokenResponse } from '../../../../packages/shared/src/tokens';

export interface TokenExchangeRequest {
  grantType: string;
  code: string;
  redirectUri: string;
  codeVerifier: string;
  clientAssertionType: string;
  clientAssertion: string;
  dpopHeader: string;
  method: string;
  url: string;
}

export class TokenExchangeUseCase {
  constructor(
    private clientAuthService: ClientAuthenticationService,
    private tokenService: TokenService,
    private authCodeRepository: AuthorizationCodeRepository,
    private tokenRepository: DrizzleTokenRepository,
    private dpopValidator: DPoPValidator,
    private issuer: string
  ) {}

  async execute(request: TokenExchangeRequest): Promise<TokenResponse> {
    const { 
      grantType, 
      code, 
      redirectUri, 
      codeVerifier, 
      clientAssertionType, 
      clientAssertion, 
      dpopHeader,
      method,
      url
    } = request;

    // 1. Validate Grant Type
    if (grantType !== 'authorization_code') {
      throw FapiErrors.unsupportedGrantType();
    }

    // 2. Authenticate Client
    const { clientId } = await this.clientAuthService.authenticate(clientAssertion, clientAssertionType);

    // 3. Validate DPoP Proof
    const dpopResult = await this.dpopValidator.validate(clientId, {
      proof: dpopHeader,
      method,
      url,
    });

    if (!dpopResult.isValid) {
      throw FapiErrors.invalidDpopProof(dpopResult.error);
    }

    // 4. Resolve Authorization Code
    const authCode = await this.authCodeRepository.getByCode(code);
    if (!authCode) {
      throw FapiErrors.invalidGrant('Code is invalid, expired, or already used');
    }

    // 5. Verify Client ID and Redirect URI
    if (authCode.clientId !== clientId) {
      throw FapiErrors.invalidGrant('Code was issued to a different client');
    }

    if (authCode.redirectUri !== redirectUri) {
      throw FapiErrors.invalidGrant('redirect_uri mismatch');
    }

    // 6. Verify PKCE
    const isPkceValid = await validatePKCE(codeVerifier, authCode.codeChallenge);
    if (!isPkceValid) {
      throw FapiErrors.invalidGrant('PKCE code_verifier validation failed');
    }

    // 7. Verify DPoP Binding (jkt MUST match the one from the PAR/Auth phase)
    if (authCode.dpopJkt !== dpopResult.jkt) {
      throw FapiErrors.invalidDpopProof('DPoP key binding mismatch');
    }

    // 8. One-Time Use: Mark code as used
    await this.authCodeRepository.markAsUsed(code);

    // 9. Generate Tokens
    const tokens = await this.tokenService.generateTokens({
      userId: authCode.userId,
      clientId: authCode.clientId,
      dpopJkt: dpopResult.jkt,
      scope: authCode.scope,
      nonce: authCode.nonce || undefined,
      issuer: this.issuer,
    });

    // 10. Persist Tokens
    await this.tokenRepository.saveAccessToken({
      token: tokens.access_token,
      userId: authCode.userId,
      clientId: authCode.clientId,
      dpopJkt: dpopResult.jkt,
      scope: authCode.scope,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
    });

    if (tokens.refresh_token) {
      await this.tokenRepository.saveRefreshToken({
        token: tokens.refresh_token,
        userId: authCode.userId,
        clientId: authCode.clientId,
        dpopJkt: dpopResult.jkt,
        scope: authCode.scope,
        expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000), // 30 days
      });
    }

    return tokens;
  }
}
