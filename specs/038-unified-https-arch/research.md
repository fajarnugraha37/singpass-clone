# Research: Unified HTTPS Architecture

## C1: Automated TLS Generation Library

**Decision**: Use `selfsigned` npm package.
**Rationale**: It is a pure JavaScript implementation of X.509 certificate generation, making it highly portable and "Node-compatible" as requested. It avoids dependency on the system having `openssl` installed, which improves local development consistency across OSs (Windows/macOS/Linux).
**Alternatives considered**: 
- `openssl` via `spawn`: Rejected because it requires `openssl` to be in the PATH, which is not guaranteed on all Windows setups without extra steps.
- `node-forge`: Also possible, but `selfsigned` is a higher-level wrapper specifically for this use case.

## C2: Bun.serve configuration for multiple ports

**Decision**: Run two separate `Bun.serve` instances.
**Rationale**: `Bun.serve` takes a single `port` in its configuration object. To listen on both 80 and 443, we must start two servers. One will handle the main Hono application on port 443 (with TLS), and the other will be a minimal Hono app on port 80 that performs a 301/302 redirect to the HTTPS origin.
**Implementation Detail**:
- Server 1 (HTTPS): `Bun.serve({ port: 443, fetch: app.fetch, tls: { key, cert } })`
- Server 2 (HTTP): `Bun.serve({ port: 80, fetch: redirectApp.fetch })`

## C3: Static file serving middleware for Hono in Bun

**Decision**: Use `hono/bun`'s `serveStatic` with a custom path mapping.
**Rationale**: `hono/bun` provides optimized static file serving for the Bun runtime. We will configure it to serve files from `../frontend/dist`.
**Implementation Detail**:
```typescript
app.use('/*', serveStatic({ 
  root: '../frontend/dist',
  rewriteRequestPath: (path) => path === '/' ? '/index.html' : path
}));
```
We also need to ensure that the backend's `static/` directory (if still used for something) doesn't conflict, or we merge them. The requirement says "serve the apps/frontend/dist folder as static assets".

## Port Refactoring

- **Current Ports**: 3000 (Backend), 4321 (Frontend).
- **Target Ports**: 80, 443.
- **Action**: Search and replace `3000` and `4321` in:
  - `.env` files (e.g., `PUBLIC_API_URL`, `OIDC_ISSUER`)
  - `packages/shared/src/config.ts`
  - `apps/frontend/astro.config.mjs`
  - `README.md` files
  - `apps/backend/src/index.ts` (CORS settings)
