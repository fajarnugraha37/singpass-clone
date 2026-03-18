import * as jose from 'jose';
import type { CryptoService } from '../../domain/crypto_service';
import type { ClientRegistry } from '../../domain/client_registry';
import type { JtiStore } from '../../utils/dpop_validator';
import { FapiErrors } from '../../../infra/middleware/fapi-error';
import { JWKSCacheService } from '../../../infra/adapters/jwks_cache';

export interface ClientAuthenticationResult {
  clientId: string;
}

export class ClientAuthenticationService {
  constructor(
    private cryptoService: CryptoService,
    private clientRegistry: ClientRegistry,
    private jwksCache: JWKSCacheService,
    private jtiStore?: JtiStore,
  ) {}

  /**
   * Validates a client_assertion using private_key_jwt as per FAPI 2.0.
   */
  async authenticate(assertion: string, assertionType: string): Promise<ClientAuthenticationResult> {
    if (assertionType !== 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer') {
      throw FapiErrors.invalidRequest('Unsupported client_assertion_type');
    }

    if (!assertion) {
      throw FapiErrors.invalidClient('client_assertion is missing');
    }

    try {
      // 1. Decode header to get kid and clientId (iss)
      const header = jose.decodeProtectedHeader(assertion);
      const payload = jose.decodeJwt(assertion);
      
      const clientId = payload.iss;
      if (!clientId) {
        throw FapiErrors.invalidClient('client_assertion missing iss');
      }

      // 2. Resolve client config and public key
      const clientConfig = await this.clientRegistry.getClientConfig(clientId);
      if (!clientConfig) {
        throw FapiErrors.invalidClient('Client not found');
      }

      // 2.1 Check Activation Status (US3 Compliance)
      if (clientConfig.isActive === false) {
        throw FapiErrors.unauthorizedClient('Client is deactivated');
      }

      // 3. Find matching signature key
      const kid = header.kid;
      let clientKey: jose.JWK | undefined;
      
      if (clientConfig.jwksUri) {
        try {
          clientKey = await this.jwksCache.getClientSigningKey(clientId, clientConfig.jwksUri, kid);
        } catch (err: any) {
          throw FapiErrors.invalidClient(`Failed to fetch signing key from jwks_uri: ${err.message}`);
        }
      } else {
        clientKey = clientConfig?.jwks?.keys.find(k => (k.use === 'sig' || k.key_ops?.includes('verify')) && (!kid || k.kid === kid));
      }
      
      if (!clientKey) {
        throw FapiErrors.invalidClient('No valid public key found for client');
      }

      // 4. Verify assertion signature and standard claims
      const isValid = await this.cryptoService.validateClientAssertion(assertion, clientKey);
      if (!isValid) {
        throw FapiErrors.invalidClient('Client assertion signature validation failed');
      }

      // 4.1 JTI replay check
      if (this.jtiStore && payload.jti) {
        const isUsed = await this.jtiStore.isUsed(payload.jti as string, clientId);
        if (isUsed) {
          throw FapiErrors.invalidClient('jti has already been used');
        }
        const exp = (payload.exp as number) || (Math.floor(Date.now() / 1000) + 120);
        await this.jtiStore.markUsed(payload.jti as string, clientId, new Date(exp * 1000));
      }

      // 5. Additional FAPI 2.0 checks (aud, exp, etc. are typically handled by cryptoService.validateClientAssertion)
      // but let's be explicit if needed.

      return { clientId };
    } catch (err: any) {
      if (err.name === 'FapiError') throw err;
      throw FapiErrors.invalidClient(err.message);
    }
  }
}
