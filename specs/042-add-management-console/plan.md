# Implementation Plan: Vibe-Auth Developer & Admin Console

**Branch**: `042-add-management-console` | **Date**: 2026-04-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/042-add-management-console/spec.md`

## Summary

Implement the "Vibe Management Console"—a unified Developer Portal and Admin Dashboard for the vibe-auth monorepo. This provides a secure, role-based interface for Developers (self-service client management) and Admins (global oversight, session revocation, sandbox data generation).

## Technical Context

**Language/Version**: TypeScript 5.x, Bun 1.1+
**Primary Dependencies**: Astro, Hono, Drizzle ORM, Svelte 5 (Runes), TailwindCSS, `jose`, `@vibe-auth/shared`
**Storage**: SQLite (via Drizzle)
**Testing**: Bun test
**Target Platform**: Node/Bun backend, Web frontend
**Project Type**: Monorepo (Web Application + API)
**Performance Goals**: Fast UI hydration via Astro, low latency Hono RPC calls.
**Constraints**: Strict Hexagonal Architecture. Business logic for management must be decoupled from Hono/Astro. Svelte 5 Runes ($state, $derived, $props) for dashboard state.
**Scale/Scope**: Server-side cursor-based pagination for >1000 items on Admin God Mode dashboard.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Architecture Check**: Follows Hexagonal Architecture, DRY, KISS. Consistent coding conventions. Separates Hono backend from Astro frontend.
- [x] **API Stability Check**: External HTTP contracts EXACTLY mirror Singpass. Internal API uses Hono RPC. Input validation on all endpoints.
- [x] **Security Check**: SQLite cookie-based sessions, OTP email auth, RBAC. Secrets NEVER logged.
- [x] **Protocol Check**: Implements proper token exchange and session management.
- [x] **Testing Check**: Unit tests exist for all logic, coverage >= 80%.
- [x] **AI Boundaries Check**: Deterministic execution, strictly follows the plan and tasks. MUST utilize local docs.
- [x] **Documentation Check**: Spec-driven and documented before implementation.

## Project Structure

### Documentation (this feature)

```text
specs/042-add-management-console/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── mgmt.ts
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
apps/backend/
├── src/
│   ├── core/           # Hexagonal Domain Logic
│   │   ├── iam/
│   │   ├── clients/
│   │   ├── sandbox/
│   │   └── sessions/
│   └── adapters/
│       ├── http/       # Hono RPC Endpoints
│       ├── database/   # Drizzle Repositories
│       └── email/      # Mock/SMTP Email Adapter
└── tests/

apps/frontend/
├── src/
│   ├── components/     # Svelte 5 Runes Components
│   ├── pages/          # Astro Pages
│   └── lib/            # Hono RPC Clients
└── tests/

packages/shared/
└── src/
    └── contracts/
        └── mgmt.ts     # Management API Schemas
```

**Structure Decision**: The Monorepo Web Application + API layout perfectly maps to the existing vibe-auth structure. We will implement Hexagonal Domain Logic within `apps/backend/src/core` and expose them via Hono in `apps/backend/src/adapters/http`. The frontend Astro app will use Svelte components located in `apps/frontend/src/components` to consume the Hono RPC client from `packages/shared`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |