# Project Onboarding: vibe-auth

## Purpose
Open-source authentication server implementing OIDC/FAPI 2.0 with a focus on Singpass integration.

## Tech Stack
- **Runtime**: Bun 1.1+
- **Backend**: Hono (TypeScript)
- **Frontend**: Astro + Svelte + TailwindCSS
- **Database**: SQLite via Drizzle ORM
- **Cryptography**: `jose` library
- **Package Manager**: Bun

## Architecture
- **Strict Hexagonal Architecture** (Ports and Adapters)
- **Monorepo**:
  - `apps/backend`: Hono service
  - `apps/frontend`: Astro application
  - `packages/shared`: Common types and contracts
  - `specs/`: Feature specifications and plans

## Development Workflow
- **Spec-Driven**: Read `specs/` before implementation.
- **TDD**: Write/run tests before completing code.
- **Hexagonal**: Core logic in `core/`, external adapters in `infra/`.

## Commands
- **Test**: `bun test` (global or package-specific)
- **Install**: `bun install`
- **Database**:
  - `bun x drizzle-kit generate`: Generate migrations
  - `bun x drizzle-kit push`: Sync schema to local SQLite
- **Lint**: `bun x eslint .`
- **Format**: `bun x prettier --write .`
