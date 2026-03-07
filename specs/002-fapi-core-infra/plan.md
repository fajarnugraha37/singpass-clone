# Implementation Plan: FAPI 2.0 Database Schema and Core Utilities

**Branch**: `002-fapi-core-infra` | **Date**: Sunday, 8 March 2026 | **Spec**: [specs/002-fapi-core-infra/spec.md](spec.md)
**Input**: Feature specification from `/specs/002-fapi-core-infra/spec.md`

## Summary

This feature establishes the foundational data layer and cryptographic utilities required for a FAPI 2.0 compliant Authorization Server. It involves defining Drizzle ORM schemas for SQLite (Users, Sessions, AuthCodes, PAR, ServerKeys, and SecurityAuditLog) and implementing core security utilities for JWKS management, Private Key JWT validation, and DPoP binding. The approach prioritizes Hexagonal Architecture by isolating these utilities into a core domain/infrastructure layer and ensuring strict adherence to Singpass/FAPI contracts.

## Technical Context

**Language/Version**: Bun (latest), TypeScript  
**Primary Dependencies**: Hono, Drizzle ORM, Zod, `jose` (JWT/JWKS), `@oslojs/crypto` (or similar for DPoP)  
**Storage**: SQLite (Drizzle)  
**Testing**: Bun test  
**Target Platform**: Bun runtime (Backend)
**Project Type**: Backend Web Service + Infrastructure Package  
**Performance Goals**: Cryptographic validation < 50ms; 100% schema migration success.  
**Constraints**: FAPI 2.0 Compliance; Singpass API contract mirroring; >80% test coverage.  
**Scale/Scope**: Core Authentication Infrastructure; 6 main database tables.

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
specs/002-fapi-core-infra/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
apps/backend/
├── src/
│   ├── core/
│   │   ├── domain/       # Entities and Interfaces (Ports)
│   │   └── application/  # Services/Use Cases (Interactors)
│   └── infra/
│       ├── adapters/     # DB, Crypto implementations (Adapters)
│       └── database/     # Drizzle schema and migrations
└── tests/                # Unit and Integration tests

packages/shared/
└── src/
    └── config.ts         # Shared validation schemas (Zod)
```

**Structure Decision**: Monorepo structure with Hono backend in `apps/backend`. Hexagonal layers within `apps/backend/src`. Shared configurations in `packages/shared`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |

## Validation Status

- **Phase 0 (Research)**: COMPLETED. `research.md` generated.
- **Phase 1 (Design)**: COMPLETED. `data-model.md`, `contracts/`, `quickstart.md` generated. Agent context updated.
- **Next Step**: Break the plan into tasks using `/speckit.tasks`.
