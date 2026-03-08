import { z } from 'zod';

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
