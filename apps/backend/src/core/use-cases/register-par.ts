import * as jose from 'jose';
import type { CryptoService } from '../domain/crypto_service';
import type { PARRepository, PARResponse, PushedAuthorizationRequest } from '../domain/par.types';
import type { SecurityAuditService } from '../domain/audit_service';
import { sharedConfig } from '../../../../../packages/shared/src/config';
import { getClientConfig } from '../../infra/adapters/client_registry';

export class RegisterParUseCase {
  constructor(
    private cryptoService: CryptoService,
    private parRepository: PARRepository,
    private auditService?: SecurityAuditService
  ) {}

  async execute(input: any): Promise<PARResponse> {
    const { 
      client_assertion, 
      client_id, 
      dpop_jkt,
      dpop_header,
      ...payload 
    } = input;

    // 1. Basic check
    if (!client_assertion) {
      throw new Error('client_assertion is required');
    }

    // 2. DPoP binding (FAPI 2.0 / PAR requirement)
    let finalDpopJkt = dpop_jkt;
    if (dpop_header) {
      try {
        // Validate DPoP proof
        const { jkt } = await this.cryptoService.validateDPoPProof(
          dpop_header,
          'POST',
          '/api/par',
          client_id
        );
        
        if (dpop_jkt && dpop_jkt !== jkt) {
          throw new Error('dpop_jkt mismatch with DPoP header');
        }
        finalDpopJkt = jkt;
      } catch (error: any) {
        await this.auditService?.logEvent({
          type: 'DPOP_VALIDATION_FAIL',
          severity: 'ERROR',
          clientId: client_id,
          details: { reason: error.message },
        });
        throw error;
      }
    }

    // 3. Validate Client Assertion (Private Key JWT)
    const client = getClientConfig(client_id);
    if (!client) {
      await this.auditService?.logEvent({
        type: 'CLIENT_AUTH_FAIL',
        severity: 'WARN',
        clientId: client_id,
        details: { reason: 'Client not found' },
      });
      throw new Error('Client not found');
    }

    const publicKey = client.jwks.keys[0]; // Simplified for now
    if (!publicKey) {
      throw new Error('Client has no registered keys');
    }

    const isValid = await this.cryptoService.validateClientAssertion(client_assertion, publicKey);
    if (!isValid) {
      // Audit log already handled by JoseCryptoService for validation failures
      throw new Error('Invalid client assertion');
    }

    // 4. JTI replay protection
    const decodedAssertion = jose.decodeJwt(client_assertion);
    const jti = decodedAssertion.jti;
    if (!jti) {
      throw new Error('client_assertion missing jti');
    }

    const isConsumed = await this.parRepository.isJtiConsumed(jti, client_id);
    if (isConsumed) {
      throw new Error('jti already used');
    }

    // 5. Mark JTI as consumed
    await this.parRepository.consumeJti(jti, client_id, new Date(Date.now() + 24 * 3600 * 1000));

    // 6. Success - store PAR
    const requestUri = `urn:ietf:params:oauth:request_uri:${crypto.randomUUID()}`;
    const expiresAt = new Date(Date.now() + sharedConfig.SECURITY.PAR_TTL_SECONDS * 1000);

    const parRequest: PushedAuthorizationRequest = {
      requestUri,
      clientId: client_id,
      dpopJkt: finalDpopJkt,
      payload,
      expiresAt,
    };

    await this.parRepository.save(parRequest);

    await this.auditService?.logEvent({
      type: 'PAR_CREATED',
      severity: 'INFO',
      clientId: client_id,
      details: { requestUri },
    });

    return {
      request_uri: requestUri,
      expires_in: sharedConfig.SECURITY.PAR_TTL_SECONDS,
    };
  }
}
