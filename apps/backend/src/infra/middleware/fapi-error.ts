import { Context, Next } from 'hono';
import { TokenErrorResponse } from '../../../../../packages/shared/src/tokens';

export class FapiError extends Error {
  constructor(
    public error: TokenErrorResponse['error'],
    public description?: string,
    public status: number = 400
  ) {
    super(description || error);
    this.name = 'FapiError';
  }
}

/**
 * Middleware to catch FapiErrors and return standard OAuth 2.0/FAPI 2.0 JSON responses.
 */
export async function fapiErrorHandler(c: Context, next: Next) {
  try {
    await next();
  } catch (err: any) {
    if (err instanceof FapiError) {
      console.warn(`[FAPI Error] ${err.error}: ${err.description || 'No description'}`);
      
      const response: TokenErrorResponse = {
        error: err.error,
        error_description: err.description,
      };

      return c.json(response, err.status as any);
    }

    // Fallback for unexpected errors
    console.error('[Unhandled Error]', err);
    
    const response: TokenErrorResponse = {
      error: 'invalid_request',
      error_description: 'An unexpected error occurred.',
    };

    return c.json(response, 500);
  }
}

/**
 * Helper to create common FAPI errors.
 */
export const FapiErrors = {
  invalidRequest: (description?: string) => new FapiError('invalid_request', description, 400),
  invalidClient: (description?: string) => new FapiError('invalid_client', description, 401),
  invalidGrant: (description?: string) => new FapiError('invalid_grant', description, 400),
  unauthorizedClient: (description?: string) => new FapiError('unauthorized_client', description, 400),
  unsupportedGrantType: (description?: string) => new FapiError('unsupported_grant_type', description, 400),
  invalidScope: (description?: string) => new FapiError('invalid_scope', description, 400),
  invalidDpopProof: (description?: string) => new FapiError('invalid_dpop_proof', description, 400),
};
