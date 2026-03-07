import { z } from 'zod';

export const sharedConfig = {
  APP_NAME: 'Vibe Auth',
  API_PREFIX: '/api',
};

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().optional(),
  PORT: z.string().default('3000'),
});

export type Env = z.infer<typeof envSchema>;

// FAPI 2.0 / PAR Validation Schemas
export const parRequestSchema = z.object({
  response_type: z.literal('code'),
  client_id: z.string().min(1),
  redirect_uri: z.string().url(),
  scope: z.string().min(1).refine((s) => s.includes('openid'), {
    message: 'scope must include openid',
  }),
  state: z.string().min(1),
  nonce: z.string().min(1),
  code_challenge: z.string().min(1),
  code_challenge_method: z.literal('S256'),
  client_assertion_type: z.literal('urn:ietf:params:oauth:client-assertion-type:jwt-bearer'),
  client_assertion: z.string().min(1),
  dpop_jkt: z.string().optional(),
});

export type PARRequest = z.infer<typeof parRequestSchema>;
