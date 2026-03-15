import { z } from 'zod';

/**
 * Successful response from the token endpoint.
 * RFC 6749 and RFC 9449 (DPoP) compliant.
 */
export const tokenResponseSchema = z.object({
  access_token: z.string().describe('The opaque access token string'),
  id_token: z.string().describe('The JWE Compact formatted ID token'),
  token_type: z.literal('DPoP').describe('DPoP token type as per RFC 9449'),
  expires_in: z.number().describe('Token lifetime in seconds'),
  refresh_token: z.string().optional().describe('Optional refresh token'),
});

/**
 * Standard OAuth 2.0 error response.
 */
export const tokenErrorResponseSchema = z.object({
  error: z.enum([
    'invalid_request',
    'invalid_client',
    'invalid_grant',
    'unauthorized_client',
    'unsupported_grant_type',
    'invalid_scope',
    'invalid_dpop_proof',
    'invalid_token',
    'server_error',
    'temporarily_unavailable'
  ]),
  error_description: z.string().optional(),
  error_uri: z.string().url().optional(),
});

export type TokenResponse = z.infer<typeof tokenResponseSchema>;
export type TokenErrorResponse = z.infer<typeof tokenErrorResponseSchema>;
