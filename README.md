# vibe-auth

This project is a monorepo for the vibe-auth application.

## Full-stack Integration

This project uses a high-performance, type-safe integration between the Hono backend and Astro frontend.

### Type-Safe RPC
The frontend interacts with the backend via **Hono RPC**. 
- Contracts are centralized in `packages/shared/src/contracts`.
- The backend exports its `AppType` from `apps/backend/src/index.ts`.
- The frontend instantiates a client in `apps/frontend/src/lib/rpc.ts`.
- Svelte islands (e.g., `SessionInfo.svelte`) use `onMount` to hydrate dynamic state (like session status and client metadata) after the static shell has loaded.

### Build-time SSG (Documentation)
Public documentation is pre-rendered at build time for optimal performance and SEO.
- Markdown files are sourced from the root `docs/` directory.
- `apps/frontend/src/pages/docs/[...path].astro` uses `getStaticPaths` to recursively map and render these files.
- Zero Cumulative Layout Shift (CLS) for documentation pages.

### CORS & Security
In development, the backend allows requests from the Astro dev server (port 4321) with `credentials: true` to support cookie-based session hydration.
In production, Astro builds into a static site that is served by the Hono backend, ensuring a unified origin.

