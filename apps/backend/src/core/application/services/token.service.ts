import * as crypto from 'crypto';
import type { CryptoService } from '../../domain/crypto_service';
import { generateEncryptedIDToken, IDTokenClaims } from '../../utils/crypto';
import type { ClientRegistry } from '../../domain/client_registry';
import { FapiErrors, FapiError } from '../../../infra/middleware/fapi-error';
import type { TokenResponse } from '../../../../../../packages/shared/src/tokens';
import { buildSubAttributes, mapLoaToAcr, UserAttributes } from '../../domain/claims';
import { sharedConfig } from '@vibe/shared/config';

export interface TokenGenerationParams {
  userId: string;
  clientId: string;
  dpopJkt: string;
  scope: string;
  nonce?: string;
  issuer: string;
  loa: number;
  amr: string[];
  user?: UserAttributes;
}

export class TokenService {
  constructor(
    private cryptoService: CryptoService,
    private clientRegistry: ClientRegistry,
  ) {}

  /**
   * Generates a complete set of tokens (Access, ID, Refresh) for a user/client session.
   */
  async generateTokens(params: TokenGenerationParams): Promise<TokenResponse> {
    const { userId, clientId, dpopJkt, scope, nonce, issuer, loa, amr, user } = params;

    // 1. Generate Opaque Access Token (typically a random string or a JWT)
    // For this project, we'll use a random high-entropy string for the opaque token.
    const accessToken = crypto.randomBytes(32).toString('base64url');
    const expiresIn = sharedConfig.SECURITY.ACCESS_TOKEN_LIFESPAN ?? 1800;

    // 2. Generate Refresh Token
    const refreshToken = crypto.randomBytes(48).toString('base64url');

    // 3. Generate ID Token (Signed then Encrypted)
    const idToken = await this.generateIdToken({
      userId,
      clientId,
      nonce,
      issuer,
      expiresIn: sharedConfig.SECURITY.ACCESS_TOKEN_LIFESPAN ?? 1800,
      loa,
      amr,
      scope,
      user
    });

    return {
      access_token: accessToken,
      id_token: idToken,
      token_type: 'DPoP',
      expires_in: expiresIn,
      refresh_token: refreshToken,
    };
  }

  private async generateIdToken(params: {
    userId: string;
    clientId: string;
    nonce?: string;
    issuer: string;
    expiresIn: number;
    loa: number;
    amr: string[];
    scope: string;
    user?: UserAttributes;
  }): Promise<string> {
    const { userId, clientId, nonce, issuer, expiresIn, loa, amr, scope, user } = params;

    // Basic validation for userId
    if (!userId) {
      throw FapiErrors.invalidToken('User ID is missing or invalid.');
    }

    // 1. Resolve Client Config and Public Encryption Key
    let clientConfig;
    try {
      clientConfig = await this.clientRegistry.getClientConfig(clientId);
    } catch (err: any) {
      console.error('[TokenService] Error fetching client config:', err);
      // Consider if this should be serverError or temporarilyUnavailable based on error type
      throw FapiErrors.temporarilyUnavailable('Could not fetch client configuration at this time.');
    }
    
    if (!clientConfig) {
      throw FapiErrors.invalidClient('Client not found');
    }

    const clientEncKey = clientConfig?.jwks?.keys.find(k => k.use === 'enc');
    if (!clientEncKey) {
      // In FAPI 2.0 / Singpass, encryption is often mandatory for PII.
      // If not found, we might fallback or throw based on policy.
      throw FapiErrors.invalidRequest('Client public encryption key not found');
    }

    // 2. Resolve Server Active Signing Key
    let serverKey;
    try {
      serverKey = await this.cryptoService.getActiveKey();
    } catch (err: any) {
      console.error('[TokenService] Error fetching active server key:', err);
      // Assuming crypto service failure is temporary or infra-related
      throw FapiErrors.temporarilyUnavailable('Could not retrieve signing key at this time.');
    }

    // 3. Prepare ID Token Claims
    const now = Math.floor(Date.now() / 1000);
    const claims: IDTokenClaims = {
      iss: issuer,
      sub: userId,
      aud: clientId,
      iat: now,
      exp: now + expiresIn,
      nonce,
      acr: mapLoaToAcr(loa),
      amr,
      sub_type: 'user',
      sub_attributes: user ? buildSubAttributes(user, scope.split(' ')) : undefined,
    };

    // 4. Sign and Encrypt (Nested JWT)
    try {
      return await generateEncryptedIDToken(
        claims,
        serverKey.privateKey,
        serverKey.id,
        clientEncKey
      );
    } catch (err: any) {
      console.error('[TokenService] Error generating encrypted ID token:', err);
      // Catching potential errors during JWT generation
      throw FapiErrors.serverError('Failed to generate ID token.');
    }
  }
}
