# Quickstart: Full-stack Hono-Astro Integration

## Developer Setup

### 1. Unified Contract Update

Update `packages/shared/src/contracts/auth.ts` to ensure `authSessionResponseSchema` is exported and used correctly by the Hono RPC.

### 2. Backend RPC Export

Ensure `apps/backend/src/index.ts` exports the `AppType`:

```typescript
export type AppType = typeof app;
```

### 3. Frontend Client Initialization

In `apps/frontend/src/lib/rpc.ts`:

```typescript
import { hc } from 'hono/client';
import type { AppType } from '../../../backend/src/index';

const backendUrl = import.meta.env.PUBLIC_BACKEND_URL || 'https://localhost';
export const client = hc<AppType>(backendUrl);
```

### 4. Svelte Component Mounting

Use `onMount` to fetch the session:

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { client } from '../lib/rpc';

  let sessionData = null;

  onMount(async () => {
    const res = await client.api.auth.session.$get();
    if (res.ok) {
      sessionData = await res.json();
    }
  });
</script>
```

## Running the Integration

1. **Start Backend**: `cd apps/backend && bun run dev`
2. **Start Frontend**: `cd apps/frontend && bun run dev`
3. **Visit UI**: `http://localhost:4321`

## Verification Checklist

- [ ] `bun x tsc --noEmit` passes in both `apps/backend` and `apps/frontend`.
- [ ] Network tab shows successful `GET /api/auth/session` with `200 OK` (when session exists).
- [ ] `astro build` successfully generates static `.html` files for all docs in `apps/frontend/dist/docs/`.
