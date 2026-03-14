import { Context } from 'hono';
import { GetUserInfoUseCase } from '../../../core/use-cases/get-userinfo';
import { getClientConfig } from '../../adapters/client_registry';

export const getUserInfo = (useCase: GetUserInfoUseCase, issuer: string) => async (c: Context) => {
  const authHeader = c.req.header('Authorization');
  const dpopHeader = c.req.header('DPoP');

  if (!authHeader || !authHeader.startsWith('DPoP ')) {
    return c.json({
      error: 'invalid_request',
      error_description: 'Missing or invalid Authorization header'
    }, 401, {
      'WWW-Authenticate': 'DPoP error="invalid_token"'
    });
  }

  if (!dpopHeader) {
    return c.json({
      error: 'invalid_dpop_proof',
      error_description: 'Missing DPoP header'
    }, 401, {
      'WWW-Authenticate': 'DPoP error="invalid_dpop_proof"'
    });
  }

  const accessToken = authHeader.substring(5);
  const method = c.req.method;
  const url = c.req.url;

  try {
    // We need to find the clientId first to get its JWKS
    // The use case will retrieve the token which has the clientId
    // So we might need to update the use case to handle fetching JWKS internally
    // OR we pass a function to fetch JWKS to the use case.
    
    // For now, let's assume the use case can handle it if we pass a way to get the jwks.
    // Actually, the client registry is an adapter, so the use case shouldn't depend on it directly.
    // I'll pass a jwksProvider function or similar.

    const result = await useCase.execute({
      accessToken,
      dpopProof: dpopHeader,
      method,
      url,
      issuer,
    });

    c.header('Content-Type', 'application/jwt');
    return c.text(result);
  } catch (error: any) {
    console.error('[UserInfo Error]', error.message);
    
    if (error.message.startsWith('invalid_dpop_proof')) {
      return c.json({
        error: 'invalid_dpop_proof',
        error_description: error.message.split(': ')[1] || 'DPoP validation failed'
      }, 401);
    }

    if (error.message === 'invalid_token') {
      return c.json({
        error: 'invalid_token',
        error_description: 'The access token is invalid or has expired'
      }, 401);
    }

    return c.json({
      error: 'server_error',
      error_description: 'An internal server error occurred'
    }, 500);
  }
};
