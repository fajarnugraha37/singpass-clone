# vibe-auth Project Context

**Current Feature**: 001-setup-monorepo-infra
**Tech Stack**:
- **Language/Version**: TypeScript 5.x / Bun 1.1+
- **Primary Dependencies**: Astro, Hono, Drizzle ORM, Svelte, TailwindCSS
- **Storage**: SQLite (via Drizzle)
- **Testing**: Bun test
- **Project Type**: Monorepo (Web Application + API)

## Mandates
- **Architecture**: Strict Hexagonal Architecture (Ports and Adapters).
- **Isolation**: Separate `apps/backend` (Hono) and `apps/frontend` (Astro).
- **Contracts**: Use Hono RPC for internal API type safety.
- **Standards**: DRY, KISS, Documentation-First, Specification-Driven.
- **Testing**: Unit tests for all logic, code coverage >= 80%.
- **AI**: Deterministic sub-tasks, prioritize local documentation in `docs/` as the primary source of truth.

## Project Structure
- `apps/backend`: Hono backend service.
- `apps/frontend`: Astro frontend with Svelte islands.
- `packages/shared`: Shared types, contracts, and utilities.
- `specs/`: Project feature specifications and plans.
