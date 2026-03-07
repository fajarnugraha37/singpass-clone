# Research Report: Setup Monorepo Infrastructure

**Feature**: 001-setup-monorepo-infra
**Status**: In Progress

## Research Tasks

### RT-001: Testing Framework Selection (Bun Test vs. Vitest)

- **Goal**: Decide on a testing runner for the Astro+Hono hybrid.
- **Decision**: Bun Test.
- **Rationale**: Bun Test is natively integrated into the chosen runtime (Bun), offering near-instant startup times. It supports TypeScript out of the box and is compatible with the `jest` style API. For Astro, we can use Playwright/Cypress for E2E, but for unit testing logic in Hono and Svelte components, Bun Test is the fastest path.
- **Alternatives considered**: Vitest (excellent for Vite-based projects like Astro, but slightly slower startup than Bun Test in this specific environment).

### RT-002: Hono RPC in Monorepo Structure

- **Goal**: Optimize E2E type safety between `apps/backend` and `apps/frontend`.
- **Decision**: Define API types in `apps/backend` and export a `AppType` that `apps/frontend` consumes via a shared package or direct workspace reference.
- **Rationale**: Hono RPC allows the frontend to have a typed client that mirrors the backend API without manual schema generation (Swagger/OpenAPI). This aligns with the "DRY" and "API Stability" principles of the constitution.
- **Alternatives considered**: Manually defining interfaces (prone to drift).

### RT-003: Monorepo Dependency Management (Bun Workspaces)

- **Goal**: Standardize package management.
- **Decision**: Use Bun Workspaces with a single root `bun.lock` file.
- **Rationale**: Prevents dependency fragmentation and allows `bun install` to be the single command to sync the entire repo.
- **Alternatives considered**: PNPM Workspaces (also good, but redundant since we are committed to Bun).

### RT-004: Hexagonal Architecture Folder Layout for Hono

- **Goal**: Practical implementation of "Ports and Adapters" in a Hono context.
- **Decision**:
  - `src/core/domain`: Pure logic, entities, and port definitions (interfaces).
  - `src/core/application`: Use cases, orchestrating domain logic.
  - `src/infra/adapters`: Concrete implementations (Drizzle DB, external API calls, Hono route handlers).
- **Rationale**: Clear separation of concerns, making the core logic testable without a real database or HTTP server.
- **Alternatives considered**: Standard "MVC" or "Rails-style" (violates the constitution's Hexagonal mandate).

## Findings Summary

The stack (Bun, Astro, Hono, Drizzle) is highly compatible. Using Bun Test at the root and shared TSConfigs in `packages/config` will provide the most consistent DX.
