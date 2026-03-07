# Implementation Plan: Setup Monorepo Infrastructure

**Branch**: `001-setup-monorepo-infra` | **Date**: 2026-03-08 | **Spec**: [specs/001-setup-monorepo-infra/spec.md]
**Input**: Feature specification from `/specs/001-setup-monorepo-infra/spec.md`

## Summary

Establish a robust Bun-based monorepo structure utilizing Astro for the frontend, Hono for the backend, and Drizzle ORM with SQLite for persistence. This phase focuses on configuring the core workspace, shared type contracts via Hono RPC, and a unified testing/linting environment to support the project's long-term architectural mandates (Hexagonal Architecture, 80% coverage).

## Technical Context

**Language/Version**: TypeScript 5.x / Bun 1.1+  
**Primary Dependencies**: Astro, Hono, Drizzle ORM, Svelte, TailwindCSS  
**Storage**: SQLite (via Drizzle)  
**Testing**: Bun test (preferred for speed)
**Target Platform**: Bun Runtime (Server), Modern Browsers (Client)
**Project Type**: Monorepo (Web Application + API)  
**Performance Goals**: < 2s cold start for dev server, < 60s full monorepo install  
**Constraints**: >80% code coverage mandate, strict Hexagonal Architecture isolation  
**Scale/Scope**: Initial scaffolding for identity provider system

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Architecture Check**: Follows Hexagonal Architecture, DRY, KISS. Consistent coding conventions. Separates Hono backend from Astro frontend.
- [x] **API Stability Check**: External HTTP contracts EXACTLY mirror Singpass. Internal API uses Hono RPC. Input validation on all endpoints.
- [x] **Security Check**: SQLite cookie-based sessions, 2FA, OIDC/FAPI 2.0. Secrets NEVER logged (or masked).
- [x] **Protocol Check**: Implements proper token exchange and passwordless/fallback flows.
- [x] **Testing Check**: Unit tests exist for all logic, coverage >= 80%.
- [x] **AI Boundaries Check**: Deterministic execution, strictly follows the plan and tasks. MUST utilize local `docs/singpass-server` and `docs/singpass-client` as the primary source of truth.
- [x] **Documentation Check**: Spec-driven and documented before implementation.

## Project Structure

### Documentation (this feature)

```text
specs/001-setup-monorepo-infra/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── checklists/          # Quality checklists
    └── requirements.md
```

### Source Code (repository root)

```text
apps/
├── backend/             # Hono API
│   ├── src/
│   │   ├── core/        # Domain & Application layers (Hexagonal)
│   │   ├── infra/       # Adapters (Drizzle, SQLite, HTTP)
│   │   └── index.ts     # Entry point
│   └── tests/
└── frontend/            # Astro + Svelte
    ├── src/
    │   ├── components/  # Svelte islands
    │   ├── layouts/
    │   └── pages/
    └── tests/

packages/
├── shared/              # Shared types, RPC contracts, constants
└── config/              # Shared ESLint, Prettier, TSConfig bases
```

**Structure Decision**: Option 2 (Web application) with a dedicated `packages/shared` for Hono RPC contracts and shared domain types to ensure E2E type safety.

## Complexity Tracking

*No current violations of the Constitution.*
