import { z } from 'zod';

export const QRStatusEnum = z.enum(['PENDING', 'AUTHORIZED', 'CANCELLED', 'EXPIRED', 'ERROR']);

export const QRInitResponseSchema = z.object({
  sessionId: z.string().uuid(),
  qrUrl: z.string().url(),
  expiresIn: z.number(),
  state: z.string(),
});

export const QRStatusResponseSchema = z.object({
  status: QRStatusEnum,
  redirectUrl: z.string().optional(),
});

export type QRStatus = z.infer<typeof QRStatusEnum>;
export type QRInitResponse = z.infer<typeof QRInitResponseSchema>;
export type QRStatusResponse = z.infer<typeof QRStatusResponseSchema>;
