# Implementation Plan: Fix FAPI Error Types

**Branch**: `024-fix-fapi-errors` | **Date**: 2026-03-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/024-fix-fapi-errors/spec.md`

## Summary

This feature will align the FAPI error handling with the Singpass specification by adding the missing error types (`server_error`, `temporarily_unavailable`, `invalid_token`) to the `tokenErrorResponseSchema` and creating corresponding factory methods in the `FapiErrors` helper.

## Technical Context

**Language/Version**: TypeScript 5.x / Bun 1.1+
**Primary Dependencies**: Hono, Drizzle ORM, Zod
**Storage**: SQLite (via Drizzle)
**Testing**: Bun test
**Target Platform**: Node.js
**Project Type**: Monorepo (Web Application + API)
**Performance Goals**: N/A
**Constraints**: N/A
**Scale/Scope**: Small bug fix.

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
specs/024-fix-fapi-errors/
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
    └── src/
        ├── features/
        │   └── fapi-token/
        │       ├── lib/
        │       │   └── fapi-errors.ts
        │       └── schemas/
        │           └── token-error-response-schema.ts
        └── tests/
            └── features/
                └── fapi-token/
                    └── lib/
                        └── fapi-errors.test.ts
```

**Structure Decision**: The changes will be contained within the existing `apps/backend` structure, modifying the FAPI token feature.

## Complexity Tracking

No violations to the constitution were necessary.
