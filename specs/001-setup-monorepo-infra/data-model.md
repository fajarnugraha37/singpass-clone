# Data Model: Infrastructure Layout

**Feature**: 001-setup-monorepo-infra
**Status**: Draft

## Monorepo Workspace Structure (Bun)

### Root Configuration
- `package.json`: Manages shared dependencies and workspaces.
- `bun.lock`: Unified lock file for all workspaces.
- `tsconfig.json`: Base configuration (Astro, Hono, Shared).
- `.gitignore`: Standard Node/Bun ignores with project-specific additions.

### Shared Workspace (`packages/shared`)
- **Entities**:
  - `Constants`: Shared strings and configuration keys.
  - `Types`: Shared TypeScript interfaces between frontend and backend.
  - `RPC Contracts`: The exported `AppType` from Hono to provide E2E safety.

### Backend Workspace (`apps/backend`)
- **Entities**:
  - `Domain Model`: Pure TypeScript classes/interfaces for User, Session, Token.
  - `Infrastructure Model`: Drizzle schemas (SQLite) mapping to domain entities.
  - `Ports/Adapters`: Inversion of control interfaces.

### Frontend Workspace (`apps/frontend`)
- **Entities**:
  - `Astro Pages`: Routing and SSG components.
  - `Svelte Components`: Interactive UI elements (islands).
  - `RPC Client`: Typed Hono client consuming the shared contract.
