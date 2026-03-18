# Contract: Full-stack Auth Integration

## Unified Contract Location
All Zod schemas and TypeScript types for the Hono RPC communication MUST be defined in:
`packages/shared/src/contracts/auth.ts`

## Required Schema: AuthSessionResponse
This schema is used for hydrating the client-side session state (SC-001, SC-003).

```typescript
export const authSessionResponseSchema = z.object({
  clientId: z.string(),
  clientName: z.string(),
  purpose: z.string().nullable().optional(),
  status: z.enum(['pending', 'authenticated', 'expired', 'failed']),
  expiresAt: z.string().or(z.date()),
});
```

## Required RPC Endpoint
The backend MUST implement and export a route that uses this schema:

```typescript
// apps/backend/src/infra/http/authRouter.ts
authRouter.get('/session', authController.getSession(sessionRepository, clientRegistry))
```

## Required Client Export
The frontend MUST export a type-safe client based on the backend's `AppType`:

```typescript
// apps/frontend/src/lib/rpc.ts
export const client = hc<AppType>(backendUrl);
```
