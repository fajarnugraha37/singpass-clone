# Research: Full-stack Hono-Astro Integration

## Decision: Hono RPC Implementation
**Rationale**: End-to-end type safety is a core requirement (SC-001). Using Hono's `hc` (Hono Client) with the exported `AppType` from the backend ensures that any change in the backend API contract immediately breaks the frontend build, providing a robust developer experience.
**Alternatives considered**: 
- Standard `fetch` with manual type casting: Rejected due to high risk of desynchronization and lack of autocompletion.
- GraphQL: Rejected as overkill for the current feature set and contrary to the KISS principle.

## Decision: Svelte-RPC Integration for Hydration
**Rationale**: To meet SC-003 (<250ms hydration), we will use Svelte's `onMount` lifecycle hook. This ensures that the static shell (Astro) loads immediately, and the dynamic parts (Session info, Client Name) are populated as soon as the client-side JavaScript executes.
**Implementation Detail**: The RPC client will be used inside `onMount` to fetch `/api/auth/session`.

## Decision: Build-time Documentation Rendering (SSG)
**Rationale**: Public documentation and registry pages are static by nature. Using `getStaticPaths` allows us to pre-render these pages at build time, ensuring zero Cumulative Layout Shift (SC-002) and optimal SEO/performance.
**Source Data**: Documentation will be sourced from the existing Markdown files in the `docs/` directory of the monorepo root.

## Decision: Monorepo Contract Unification
**Rationale**: Adhering to the "Unified contract" requirement (FR-005), we will consolidate all Zod schemas used for API validation in `packages/shared/src/contracts`. Both `zValidator` in Hono and type inference in Svelte will use these single sources of truth.

## Unresolved Unknowns (NEEDS CLARIFICATION)
1.  **CORS/Cookie Sharing**: Since `apps/frontend` (Astro) and `apps/backend` (Hono) might run on different ports during development, we must ensure `credentials: 'include'` is set in the RPC client and CORS is correctly configured in the backend to allow cookie-based session hydration.
2.  **Documentation File Mapping**: We need a clear mapping between the files in `docs/` and the generated URLs in the frontend. We will use a recursive file glob in `getStaticPaths`.
3.  **Error Boundary Strategy**: How should Svelte components handle RPC failures (e.g., 401 Unauthorized)? We will implement a standard "anonymous" state fallback where the UI shows generic "Login" options if no session is found.
