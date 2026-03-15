import { Hono } from 'hono';
import { ValidateUserInfoRequestUseCase } from '../../../application/usecases/validate-userinfo-request';
import { GenerateUserInfoPayloadUseCase } from '../../../application/usecases/generate-userinfo-payload';
import { UserInfoRepository } from '../../../core/domain/userinfo_repository';
import { ClientRegistry } from '../../../core/domain/client_registry';
import { JWKSCacheService } from '../../adapters/jwks_cache';
import { SecurityAuditService } from '../../../core/domain/audit_service';

/**
 * Router for the OIDC Userinfo endpoint, aligned with Myinfo v5 specs.
 */
export const createUserinfoRouter = (
  validateUseCase: ValidateUserInfoRequestUseCase,
  generateUseCase: GenerateUserInfoPayloadUseCase,
  repository: UserInfoRepository,
  clientRegistry: ClientRegistry,
  jwksCache: JWKSCacheService,
  auditService: SecurityAuditService,
  issuer: string
) => {
  const router = new Hono();

  const handleUserInfo = async (c: any) => {
    const authHeader = c.req.header('Authorization');
    const dpopHeader = c.req.header('DPoP');

    if (!authHeader || !authHeader.startsWith('DPoP ')) {
      const error_description = 'Missing or invalid Authorization header';
      return c.json({
        error: 'invalid_request',
        error_description
      }, 401, {
        'WWW-Authenticate': `DPoP error="invalid_request", error_description="${error_description}"`
      });
    }

    if (!dpopHeader) {
      const error_description = 'Missing DPoP header';
      return c.json({
        error: 'invalid_dpop_proof',
        error_description
      }, 401, {
        'WWW-Authenticate': `DPoP error="invalid_dpop_proof", error_description="${error_description}"`
      });
    }

    const accessToken = authHeader.substring(5);
    const method = c.req.method;
    const url = c.req.url;

    try {
      // 1. Validate request (Access Token & DPoP)
      const tokenData = await validateUseCase.execute(accessToken, dpopHeader, method, url);

      // 2. Retrieve Myinfo Profile from database
      const person = await repository.getMyinfoProfile(tokenData.userId);
      if (!person) {
        throw new Error('invalid_token');
      }

      // 3. Get Client Encryption Key from Registry or Cache
      const client = await clientRegistry.getClientConfig(tokenData.clientId);
      if (!client) throw new Error('invalid_client');

      let clientPublicKey;
      if (client.jwksUri) {
        clientPublicKey = await jwksCache.getClientEncryptionKey(tokenData.clientId, client.jwksUri);
      } else if (client.jwks) {
        clientPublicKey = client.jwks.keys.find(k => k.use === 'enc' || k.key_ops?.includes('encrypt'));
      }

      if (!clientPublicKey) throw new Error('no_client_encryption_key');

      // 4. Generate JWS-in-JWE payload aligned with Myinfo v5
      const result = await generateUseCase.execute(person, clientPublicKey, issuer, tokenData.clientId);

      await auditService.logEvent({
        type: 'USERINFO_SUCCESS',
        severity: 'INFO',
        clientId: tokenData.clientId,
        details: { sub: person.userId }
      });

      c.header('Content-Type', 'application/jwt');
      return c.text(result);
    } catch (error: any) {
      console.error('[UserInfo Error]', error.message);
      
      if (error.message.startsWith('invalid_dpop_proof')) {
        const error_description = error.message.split(': ')[1] || 'DPoP validation failed';
        return c.json({
          error: 'invalid_dpop_proof',
          error_description
        }, 401, {
          'WWW-Authenticate': `DPoP error="invalid_dpop_proof", error_description="${error_description}"`
        });
      }

      if (error.message === 'invalid_token') {
        const error_description = 'The access token is invalid or has expired';
        return c.json({
          error: 'invalid_token',
          error_description
        }, 401, {
          'WWW-Authenticate': `DPoP error="invalid_token", error_description="${error_description}"`
        });
      }

      if (error.message === 'invalid_client' || error.message === 'no_client_encryption_key' || error.message.startsWith('invalid_request')) {
        const error_description = error.message === 'no_client_encryption_key' 
          ? 'Client encryption key not found' 
          : (error.message.split(': ')[1] || 'Invalid request');
        
        return c.json({
          error: 'invalid_request',
          error_description
        }, 401, {
          'WWW-Authenticate': `DPoP error="invalid_request", error_description="${error_description}"`
        });
      }

      await auditService.logEvent({
        type: 'USERINFO_FAILURE',
        severity: 'WARN',
        details: { reason: error.message }
      });

      return c.json({
        error: 'server_error',
        error_description: 'An internal server error occurred'
      }, 500);
    }
  };

  router.get('/', handleUserInfo);
  router.post('/', handleUserInfo);

  return router;
};
