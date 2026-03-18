# Implementation Plan: Full-stack Hono-Astro Integration

**Branch**: `037-hono-astro-integration` | **Date**: 2026-03-19 | **Spec**: [/specs/037-hono-astro-integration/spec.md]
**Input**: Feature specification from `/specs/037-hono-astro-integration/spec.md`

## Summary

Implement the integration layer between the Hono backend and Astro frontend using type-safe RPC and build-time SSG. This plan focuses on ensuring end-to-end type safety (SC-001) and meeting performance requirements for both static documentation (SC-002) and dynamic session hydration (SC-003).

## Technical Context

**Language/Version**: TypeScript 5.x / Bun 1.1+  
**Primary Dependencies**: Astro, Hono, Svelte, TailwindCSS, `@vibe-auth/shared`  
**Storage**: SQLite (via Drizzle)  
**Testing**: Bun test  
**Target Platform**: Node.js/Bun (Backend), Browser (Frontend)
**Project Type**: Web Application (Monorepo)  
**Performance Goals**: Dynamic session hydration < 250ms (SC-003), Zero CLS on static documentation (SC-002).  
**Constraints**: SSG for documentation, RPC for all frontend-to-backend communication.  
**Scale/Scope**: Full-stack integration across monorepo boundaries.

## Constitution Check

- [x] **Architecture Check**: Follows Hexagonal Architecture, DRY, KISS. Separates Hono backend from Astro frontend.
- [x] **API Stability Check**: Internal API uses Hono RPC. Input validation on all endpoints.
- [x] **Security Check**: SQLite cookie-based sessions, 2FA, OIDC/FAPI 2.0.
- [x] **Protocol Check**: Implements proper token exchange and session retrieval.
- [x] **Testing Check**: Unit tests for integration logic.
- [x] **AI Boundaries Check**: Deterministic execution following local documentation.
- [x] **Documentation Check**: Spec-driven and documented before implementation.

## Project Structure

### Documentation (this feature)

```text
specs/037-hono-astro-integration/
├── plan.md              # This file
├── research.md          # Research findings and decisions
├── data-model.md        # Data entities and relationships
├── quickstart.md        # Developer setup and testing
├── contracts/           # API contract definitions
└── tasks.md             # (Created by /speckit.tasks)
```

### Source Code (repository root)

```text
apps/backend/src/
├── application/     # Use cases (ValidateUserInfo, etc.)
├── core/            # Domain logic and entities
└── infra/           # Hono routes and DB adapters

apps/frontend/src/
├── components/      # Svelte islands (Hydration logic)
├── lib/             # RPC client (rpc.ts)
└── pages/           # Astro pages (Documentation via getStaticPaths)

packages/shared/src/
└── contracts/       # Unified Zod schemas
```

**Structure Decision**: Monorepo architecture with distinct apps for frontend and backend, unified by `packages/shared` contracts.

## Phase 0: Outline & Research

1.  **Extract unknowns from Technical Context**:
    *   Research CORS configuration for Hono in development.
    *   Research Astro recursive file globbing for `getStaticPaths`.
2.  **Generate research agent findings**:
    *   `research.md` created with decisions on Hono RPC, Svelte hydration, and SSG strategy.

## Phase 1: Design & Contracts

1.  **Extract entities from feature spec** → `data-model.md`:
    *   `SessionContext`, `ClientMetadata`, `APIContract`.
2.  **Define interface contracts** → `packages/shared/src/contracts/`:
    *   Ensure `authSessionResponseSchema` covers all needs for SC-003.
3.  **Agent context update**:
    *   Run `update-agent-context.ps1`.

## Phase 2: Implementation Plan

1.  **Backend Integration**:
    *   Export `AppType` from `apps/backend/src/index.ts`.
    *   Verify `/api/auth/session` endpoint implementation.
2.  **Frontend RPC Setup**:
    *   Initialize `client` in `apps/frontend/src/lib/rpc.ts` with correct backend URL and credentials.
3.  **Dynamic Hydration Component**:
    *   Create `SessionInfo.svelte` to fetch and display `Client Name` on mount.
4.  **Static Documentation Page**:
    *   Implement `apps/frontend/src/pages/docs/[...path].astro` using `getStaticPaths` to render project documentation.
5.  **Verification**:
    *   Run `bun test` in both apps.
    *   Verify SSG output with `astro build`.
