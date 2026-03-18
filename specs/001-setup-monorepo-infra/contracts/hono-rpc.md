# Interface Contract: Hono RPC (End-to-End Type Safety)

**Feature**: 001-setup-monorepo-infra
**Status**: Draft

## Contract Definition

The system MUST utilize Hono RPC to synchronize type definitions between `apps/backend` and `apps/frontend`.

### Implementation Details

1. **Backend Export**: `apps/backend/src/index.ts` must export the final application type:

   ```typescript
   // apps/backend/src/index.ts
   import { Hono } from 'hono'
   const app = new Hono().basePath('/api')
   
   const routes = app
     .get('/health', (c) => c.json({ status: 'ok' }))
     // ... other routes ...
   
   export type AppType = typeof routes
   export default app
   ```

2. **Frontend Consumption**: `apps/frontend/src/lib/api-client.ts` must use the exported type:

   ```typescript
   // apps/frontend/src/lib/api-client.ts
   import { hc } from 'hono/client'
   import type { AppType } from 'backend/src/index' // via workspace reference
   
   export const client = hc<AppType>('https://localhost/')
   ```

3. **Validation**: All endpoints MUST use `hono/zod` (or similar) to ensure the request body and parameters match the TypeScript contract at runtime.

### Benefits

- Zero-drift API documentation.
- Compile-time errors in the frontend if the backend API changes.
- Direct IDE autocomplete for API paths, methods, and response shapes.
