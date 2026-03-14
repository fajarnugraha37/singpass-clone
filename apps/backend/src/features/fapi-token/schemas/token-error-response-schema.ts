import { z } from 'zod';

export const tokenErrorResponseSchema = z.object({
  error: z.enum([
    'invalid_request',
    'invalid_client',
    'invalid_grant',
    'unauthorized_client',
    'unsupported_grant_type',
    'invalid_scope',
    'server_error', // Added for Singpass compliance
    'temporarily_unavailable', // Added for Singpass compliance
    'invalid_token', // Added for Singpass compliance
  ]),
  error_description: z.string().optional(),
  error_uri: z.string().url().optional(),
  // Other potential fields can be added here if required by Singpass spec
});

export type TokenErrorResponse = z.infer<typeof tokenErrorResponseSchema>;
