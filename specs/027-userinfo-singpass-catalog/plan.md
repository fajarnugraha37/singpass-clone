# Implementation Plan: Singpass Myinfo Userinfo Catalog Alignment

**Branch**: `027-userinfo-singpass-catalog` | **Date**: 2026-03-16 | **Spec**: [specs/027-userinfo-singpass-catalog/spec.md](./spec.md)
**Input**: Feature specification from `/specs/027-userinfo-singpass-catalog/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Align the existing `userinfo` endpoint with the official Singpass Myinfo v5 specification. This involves implementing the full catalog (Personal, Finance, Education and Employment, Family, Vehicle and Driving Licence, Property, Government Scheme), returning explicit `null` values for missing user data, and utilizing a database seed script/ORM strategy for generating comprehensive mock users (with a default password of `test1234`).

## Technical Context

**Language/Version**: TypeScript 5.x / Bun 1.1+
**Primary Dependencies**: Astro, Hono, Drizzle ORM, Svelte, TailwindCSS, `jose`, `@vibe-auth/shared`
**Storage**: SQLite (via Drizzle)
**Testing**: Bun test
**Target Platform**: Bun web server environment
**Project Type**: Monorepo (Web Application + API)
**Performance Goals**: Authentication succeeds in < 1 second; fast API responses.
**Constraints**: Must strictly follow Hexagonal Architecture (Ports and Adapters); External HTTP contracts MUST exactly mirror Singpass `userinfo` endpoint.
**Scale/Scope**: 7 Myinfo data catalog domains fully implemented; robust mock user seeding.

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
specs/027-userinfo-singpass-catalog/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
apps/backend/
├── src/
│   ├── core/
│   │   └── domain/       # Singpass User and Myinfo Catalog entities
│   ├── application/      # Userinfo retrieval use cases
│   ├── infrastructure/
│   │   ├── http/         # userinfo Hono endpoint handlers
│   │   └── database/     # Drizzle repositories and seed scripts
└── tests/
    └── unit/             # Coverage for Userinfo payload generation

packages/shared/
└── src/
    └── types/            # Myinfo Catalog type definitions (if shared)
```

**Structure Decision**: The implementation will reside strictly in the `apps/backend` (Hono/Drizzle) for the `userinfo` endpoint, and potentially `packages/shared` if types need to be exported. The test suite will be updated to cover payload validation. Mock data will be handled via Drizzle seed scripts in the backend database layer.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |
