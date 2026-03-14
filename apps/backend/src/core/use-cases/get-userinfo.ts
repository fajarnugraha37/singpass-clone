import { UserInfoRepository } from '../domain/userinfo_repository';
import { CryptoService } from '../domain/crypto_service';
import { mapUserInfoClaims } from '../domain/userinfo_claims';
import { DPoPValidator } from '../utils/dpop_validator';
import { JWKSCacheService } from '../../infra/adapters/jwks_cache';
import { ClientRegistry } from '../domain/client_registry';
import { SecurityAuditService } from '../domain/audit_service';

export interface GetUserInfoRequest {
  accessToken: string;
  dpopProof: string;
  method: string;
  url: string;
  issuer: string;
}

export class GetUserInfoUseCase {
  constructor(
    private repository: UserInfoRepository,
    private cryptoService: CryptoService,
    private dpopValidator: DPoPValidator,
    private jwksCache: JWKSCacheService,
    private clientRegistry: ClientRegistry,
    private auditService: SecurityAuditService
  ) {}

  async execute(request: GetUserInfoRequest): Promise<string> {
    const { accessToken, dpopProof, method, url, issuer } = request;

    try {
      // 1. Retrieve Access Token from repository
      const tokenData = await this.repository.getAccessToken(accessToken);
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

      // 4. Retrieve User Data
      const user = await this.repository.getUserById(tokenData.userId);
      if (!user) {
        throw new Error('invalid_token');
      }

      // 5. Map Claims based on Scopes
      const claims = mapUserInfoClaims(
        user,
        tokenData.clientId,
        issuer,
        tokenData.scope.split(' ')
      );

      // 6. Get Client Encryption Key
      const client = await this.clientRegistry.getClientConfig(tokenData.clientId);
      if (!client) {
        throw new Error('invalid_client');
      }

      let clientPublicKey;
      if (client.jwksUri) {
         clientPublicKey = await this.jwksCache.getClientEncryptionKey(
          tokenData.clientId,
          client.jwksUri
        );
      } else if (client.jwks) {
        // Find suitable encryption key in static JWKS
        clientPublicKey = client.jwks.keys.find(k => k.use === 'enc' || k.key_ops?.includes('encrypt'));
      }

      if (!clientPublicKey) {
        throw new Error('no_client_encryption_key');
      }

      // 7. Sign and Encrypt (JWS-in-JWE)
      const result = await this.cryptoService.signAndEncrypt(claims, clientPublicKey);

      await this.auditService.logEvent({
        type: 'USERINFO_SUCCESS',
        severity: 'INFO',
        clientId: tokenData.clientId,
        details: { sub: user.id, scopes: tokenData.scope }
      });

      return result;
    } catch (error: any) {
      await this.auditService.logEvent({
        type: 'USERINFO_FAILURE',
        severity: 'WARN',
        details: { reason: error.message }
      });
      throw error;
    }
  }
}
