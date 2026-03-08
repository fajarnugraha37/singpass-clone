# Implementation Plan: OIDC Authorization Endpoint and Login Flow

**Branch**: `005-oidc-auth-flow` | **Date**: 2026-03-08 | **Spec**: [link](./spec.md)
**Input**: Feature specification from `/specs/005-oidc-auth-flow/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Implement the OIDC Authorization Endpoint (`GET /auth`) and the interactive login flow, connecting the backend OIDC authorization logic to the Astro frontend UI, including a simulated 2FA fallback flow.

## Technical Context

**Language/Version**: TypeScript 5.x / Bun 1.1+
**Primary Dependencies**: Astro, Hono, Drizzle ORM, Svelte, TailwindCSS
**Storage**: SQLite (via Drizzle)
**Testing**: Bun test
**Target Platform**: Web Application + API
**Project Type**: Monorepo
**Performance Goals**: Fast token exchange, minimal latency on UI interactions, optimized island hydration via Astro.
**Constraints**: Secure cookie-based sessions, strict OIDC / FAPI 2.0 standards, secrets NEVER logged.
**Scale/Scope**: Singpass-like UI (Passwordless and 2FA fallback)

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
specs/005-oidc-auth-flow/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
apps/
├── backend/
│   ├── src/
│   │   ├── core/
│   │   │   ├── domain/       # Session & Auth Code entities
│   │   │   └── use-cases/    # Login, 2FA validation, code generation
│   │   ├── infra/
│   │   │   ├── http/         # GET /auth, POST /api/auth/login, POST /api/auth/2fa
│   │   │   └── db/           # SQLite repositories for sessions and auth codes
│   └── tests/
│
└── frontend/
    ├── src/
    │   ├── components/       # Svelte islands for Login / 2FA forms
    │   ├── pages/            # Astro pages (e.g., /login)
    │   └── lib/              # Hono RPC client configuration
    └── tests/
```

**Structure Decision**: Using the existing Monorepo Web Application structure with separate `backend` (Hono) and `frontend` (Astro) apps, joined via Hono RPC.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A       | N/A        | N/A                                 |
