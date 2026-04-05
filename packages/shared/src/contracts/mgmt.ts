import { z } from "zod";

// Base Pagination Schema
export const CursorPaginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) => z.object({
  items: z.array(itemSchema),
  nextCursor: z.string().nullable(),
});

// Authentication Schemas
export const RequestOtpSchema = z.object({
  email: z.string().email(),
});

export const RegisterDeveloperSchema = z.object({
  email: z.string().email(),
});

export const VerifyOtpSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

// Developer Entity
export const DeveloperSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(["developer", "admin"]),
  status: z.enum(["active", "deactivated"]),
  createdAt: z.string().datetime(),
});

// OIDC Client Schemas
export const ClientSchema = z.object({
  clientId: z.string(),
  developerId: z.string().uuid(),
  clientName: z.string().min(1),
  redirectUris: z.array(z.string().url()),
  jwksUri: z.string().url().nullable().optional(),
  allowedScopes: z.array(z.string()),
  grantTypes: z.array(z.string()),
  status: z.enum(["active", "inactive"]),
  createdAt: z.string().datetime(),
});

export const CreateClientSchema = ClientSchema.omit({ 
  clientId: true, 
  developerId: true, 
  status: true, 
  createdAt: true 
});

export const UpdateClientSchema = CreateClientSchema.partial();

export const ToggleClientStatusSchema = z.object({
  isActive: z.boolean(),
});

// Sandbox User Schemas
export const SandboxUserSchema = z.object({
  nric: z.string(),
  status: z.enum(["active", "deactivated"]),
  myinfoPayload: z.record(z.string(), z.unknown()), // Corrected to expect 2 arguments
});

export const CreateSandboxUserSchema = z.object({
  nric: z.string(),
  password: z.string().min(8).optional(),
  generateMockData: z.boolean().default(true),
});

export const ToggleSandboxUserStatusSchema = z.object({
  status: z.enum(["active", "deactivated"]),
});

export const ResetSandboxUserPasswordSchema = z.object({
  newPassword: z.string().min(8).optional(),
});

export const UpdateSandboxUserSchema = z.object({
  myinfoPayload: z.record(z.string(), z.unknown()),
});

// Session Schemas
export const SessionSchema = z.object({
  sessionId: z.string(),
  clientId: z.string(),
  userSub: z.string(),
  scopes: z.array(z.string()),
  expiresAt: z.string().datetime(),
  createdAt: z.string().datetime(),
});

// Endpoints mapping (Logical definition for Hono RPC)
export type ManagementAPI = {
  // Auth
  "POST /api/mgmt/auth/register": { body: typeof RegisterDeveloperSchema, response: typeof DeveloperSchema };
  "POST /api/mgmt/auth/request-otp": { body: typeof RequestOtpSchema, response: { success: boolean } };
  "POST /api/mgmt/auth/verify-otp": { body: typeof VerifyOtpSchema, response: { token: string, user: typeof DeveloperSchema } };
  "POST /api/mgmt/auth/logout": { response: { success: boolean } };
  
  // Developer (Self)
  "GET /api/mgmt/me": { response: { user: typeof DeveloperSchema } };
  "GET /api/mgmt/me/clients": { response: z.infer<ReturnType<typeof PaginatedResponseSchema<typeof ClientSchema>>> };
  "POST /api/mgmt/me/clients": { body: typeof CreateClientSchema, response: typeof ClientSchema };
  "PUT /api/mgmt/me/clients/:clientId": { body: typeof UpdateClientSchema, response: typeof ClientSchema };
  "PATCH /api/mgmt/me/clients/:clientId/status": { body: typeof ToggleClientStatusSchema, response: typeof ClientSchema };
  "DELETE /api/mgmt/me/clients/:clientId": { response: { success: boolean } }; // Soft delete
  "POST /api/mgmt/me/clients/:clientId/rotate-secret": { response: { newSecret: string } };
  "GET /api/mgmt/me/sessions": { response: z.infer<ReturnType<typeof PaginatedResponseSchema<typeof SessionSchema>>> };
  "DELETE /api/mgmt/me/sessions/:sessionId": { response: { success: boolean } };

  // Admin God Mode
  "GET /api/mgmt/admin/developers": { query: typeof CursorPaginationSchema, response: z.infer<ReturnType<typeof PaginatedResponseSchema<typeof DeveloperSchema>>> };
  "GET /api/mgmt/admin/clients": { query: typeof CursorPaginationSchema, response: z.infer<ReturnType<typeof PaginatedResponseSchema<typeof ClientSchema>>> };
  "GET /api/mgmt/admin/sessions": { query: typeof CursorPaginationSchema, response: z.infer<ReturnType<typeof PaginatedResponseSchema<typeof SessionSchema>>> };
  "DELETE /api/mgmt/admin/sessions/:sessionId": { response: { success: boolean } };
  
  // Singpass Sandbox
  "GET /api/mgmt/admin/sandbox/users": { query: typeof CursorPaginationSchema, response: z.infer<ReturnType<typeof PaginatedResponseSchema<typeof SandboxUserSchema>>> };
  "GET /api/mgmt/admin/sandbox/users/:userId": { response: typeof SandboxUserSchema };
  "POST /api/mgmt/admin/sandbox/users": { body: typeof CreateSandboxUserSchema, response: typeof SandboxUserSchema };
  "PATCH /api/mgmt/admin/sandbox/users/:userId/status": { body: typeof ToggleSandboxUserStatusSchema, response: typeof SandboxUserSchema };
  "POST /api/mgmt/admin/sandbox/users/:userId/reset-password": { body: typeof ResetSandboxUserPasswordSchema, response: { success: boolean, password: string } };
  "PUT /api/mgmt/admin/sandbox/users/:userId/attributes": { body: typeof UpdateSandboxUserSchema, response: typeof SandboxUserSchema };
  "DELETE /api/mgmt/admin/sandbox/users/:userId": { response: { success: boolean } };
};