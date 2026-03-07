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
