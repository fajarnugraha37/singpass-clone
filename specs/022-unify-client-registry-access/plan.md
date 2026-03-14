# Implementation Plan: Unify Client Registry Access

**Branch**: `022-unify-client-registry-access` | **Date**: 2026-03-15 | **Spec**: `../spec.md`
**Input**: Feature specification from `specs/022-unify-client-registry-access/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

**Primary Requirement**: Refactor the codebase to ensure all client configuration is accessed exclusively through a single, consistent `ClientRegistry` port interface, adhering to hexagonal architecture principles.
**Technical Approach**: This involves removing the direct-access `getClientConfig()` function, refactoring the `JoseCryptoService` to use an injected `ClientRegistry` port, and ensuring the `DrizzleClientRegistry` adapter correctly implements this port.

## Technical Context

**Language/Version**: TypeScript 5.x / Bun 1.1+
**Primary Dependencies**: Hono, Drizzle ORM, `jose`
**Storage**: SQLite (via Drizzle)
**Testing**: Bun test
**Target Platform**: Node.js environment (Bun)
**Project Type**: Monorepo (Web Application + API)
**Performance Goals**: The refactoring must not introduce any performance regressions.
**Constraints**: Must maintain >= 80% test coverage.
**Scale/Scope**: The change impacts all areas of the `apps/backend` service that currently retrieve client configuration.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [X] **Architecture Check**: Follows Hexagonal Architecture, DRY, KISS. Consistent coding conventions. Separates Hono backend from Astro frontend.
- [X] **API Stability Check**: External HTTP contracts EXACTLY mirror Singpass. Internal API uses Hono RPC. Input validation on all endpoints.
- [X] **Security Check**: SQLite cookie-based sessions, 2FA, OIDC/FAPI 2.0. Secrets NEVER logged (or masked).
- [X] **Protocol Check**: Implements proper token exchange and passwordless/fallback flows.
- [X] **Testing Check**: Unit tests exist for all logic, coverage >= 80%.
- [X] **AI Boundaries Check**: Deterministic execution, strictly follows the plan and tasks. MUST utilize local `docs/singpass-server` and `docs/singpass-client` as the primary source of truth.
- [X] **Documentation Check**: Spec-driven and documented before implementation.

## Project Structure

### Documentation (this feature)

```text
specs/022-unify-client-registry-access/
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
└── backend/
    ├── src/
    │   ├── core/
    │   │   ├── services/
    │   │   │   └── JoseCryptoService.ts
    │   │   └── ports/
    │   │       └── ClientRegistry.ts
    │   ├── infrastructure/
    │   │   └── drizzle/
    │   │       └── DrizzleClientRegistry.ts
    │   └── utils/
    │       └── getClientConfig.ts  # To be deleted
    └── tests/
```

**Structure Decision**: The changes will be confined to the `apps/backend` package. The primary modifications will involve updating services in `src/core/services` to use the port defined in `src/core/ports`, and removing the utility function from `src/utils`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A       |            |                                     |
