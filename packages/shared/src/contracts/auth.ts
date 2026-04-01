import { z } from 'zod';

export const initiateAuthRequestSchema = z.object({
  client_id: z.string().min(1, 'client_id is required'),
  request_uri: z.string().min(1, 'request_uri is required'),
});

export const loginRequestSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const loginResponseSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    next_step: z.literal('2fa'),
  }),
  z.object({
    success: z.literal(false),
    error: z.string(),
  }),
]);

export const twoFactorRequestSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export const twoFactorResponseSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    redirect_uri: z.string().url(),
  }),
  z.object({
    success: z.literal(false),
    error: z.string(),
  }),
]);

export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
export type TwoFactorRequest = z.infer<typeof twoFactorRequestSchema>;
export type TwoFactorResponse = z.infer<typeof twoFactorResponseSchema>;
export type InitiateAuthRequest = z.infer<typeof initiateAuthRequestSchema>;

export const authSessionResponseSchema = z.object({
  clientId: z.string(),
  clientName: z.string(),
  purpose: z.string().nullable().optional(),
  status: z.enum(['pending', 'authenticated', 'expired', 'failed']),
  expiresAt: z.string().or(z.date()),
});

export type AuthSessionResponse = z.infer<typeof authSessionResponseSchema>;

export const tokenRequestSchema = z.object({
  grant_type: z.literal('authorization_code'),
  code: z.string(),
  redirect_uri: z.string(),
  code_verifier: z.string().min(43).max(128).regex(/^[A-Za-z0-9\-\._~]+$/),
  client_assertion_type: z.literal('urn:ietf:params:oauth:client-assertion-type:jwt-bearer'),
  client_assertion: z.string(),
});

