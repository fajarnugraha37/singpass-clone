import { z } from 'zod';

export const sharedConfig = {
  APP_NAME: 'Vibe Auth',
  API_PREFIX: '/api',
  SECURITY: {
    DPOP_TTL_SECONDS: 60,
    PAR_TTL_SECONDS: 60,
    SESSION_TTL_SECONDS: 3600,
    AUTH_CODE_TTL_SECONDS: 60,
    SERVER_KEY_MIN_SIZE: 2048,
    SERVER_KEY_ROTATION_DAYS: 7, // Rotate active key every 7 days
    SERVER_KEY_GRACE_PERIOD_DAYS: 14, // Keep old keys for 14 days for verification
    MAX_AUTH_RETRIES: 3,
    ACCESS_TOKEN_LIFESPAN: 1800,
  },
  OIDC: {
    ISSUER: 'https://vibe-auth.example.com',
  }
};

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().optional(),
  PORT: z.string().default('3000'),
});

export type Env = z.infer<typeof envSchema>;

// FAPI 2.0 / PAR Validation Schemas
export enum AuthenticationContextType {
  APP_AUTHENTICATION_DEFAULT = 'APP_AUTHENTICATION_DEFAULT',
  BANK_CASA_OPENING = 'BANK_CASA_OPENING',
}

export const VALID_AUTH_CONTEXT_TYPES = Object.values(AuthenticationContextType);

export const parRequestSchema = z.object({
  response_type: z.literal('code'),
  client_id: z.string().min(1),
  redirect_uri: z.string().url(),
  scope: z.string().min(1).refine((s) => s.includes('openid'), {
    message: 'scope must include openid',
  }),
  state: z.string().min(30),
  nonce: z.string().min(30),
  code_challenge: z.string().min(1),
  code_challenge_method: z.literal('S256'),
  client_assertion_type: z.literal('urn:ietf:params:oauth:client-assertion-type:jwt-bearer'),
  client_assertion: z.string().min(1),
  purpose: z.string().min(1),
  dpop_jkt: z.string().optional(),
  authentication_context_type: z.nativeEnum(AuthenticationContextType).optional(),
  authentication_context_message: z.string().max(100).regex(/^[A-Za-z0-9 .,\-@'!()]*$/).optional(),
  redirect_uri_https_type: z.string().optional(),
  app_launch_url: z.string().url().optional(),
});

export type PARRequest = z.infer<typeof parRequestSchema>;
