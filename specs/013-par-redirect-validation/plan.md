# Implementation Plan: PAR `redirect_uri` Registration Validation

**Branch**: `013-par-redirect-validation` | **Date**: 2026-03-15 | **Spec**: [specs/013-par-redirect-validation/spec.md]
**Input**: Feature specification from `/specs/013-par-redirect-validation/spec.md`

## Summary
The goal is to implement strict `redirect_uri` validation during the Pushed Authorization Request (PAR) registration phase. This ensures that the provided redirection URI matches one of the client's pre-registered URIs in the `ClientRegistry`, preventing open redirect attacks and ensuring compliance with OIDC / FAPI 2.0 standards.

The validation will be implemented in the `RegisterParUseCase` and will enforce an exact string match (case-sensitive) and mandatory presence of the `redirect_uri` parameter.

## Technical Context

**Language/Version**: TypeScript 5.x / Bun 1.1+  
**Primary Dependencies**: Hono, Drizzle ORM, Zod, `jose`  
**Storage**: SQLite (via Drizzle) for `ClientRegistry` (currently mocked in `infra/adapters/client_registry.ts`)  
**Testing**: Bun test (unit and integration)  
**Target Platform**: Node.js / Bun server  
**Project Type**: Web Service (OIDC Identity Provider)  
**Performance Goals**: Sub-10ms validation latency  
**Constraints**: <200ms p95 response time for PAR endpoint  
**Scale/Scope**: 10k users, 50 clients  

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Architecture Check**: Follows Hexagonal Architecture (Port: `ClientRegistry`, Adapter: `DrizzleClientRegistry`). Validation is in the Use Case (Domain logic).
- [x] **API Stability Check**: External HTTP contract for PAR (`POST /par`) remains stable. Validation strictly mirrors Singpass and OIDC expectations.
- [x] **Security Check**: Enforces strict `redirect_uri` matching, preventing open redirection.
- [x] **Protocol Check**: Correctly integrates with the PAR/Authorization flow.
- [x] **Testing Check**: Unit tests will cover all validation scenarios (valid, invalid, case mismatch, missing).
- [x] **AI Boundaries Check**: Deterministic execution, grounded in local `docs/`.
- [x] **Documentation Check**: Spec and research completed before implementation.

## Project Structure

### Documentation (this feature)

```text
specs/013-par-redirect-validation/
├── plan.md              # This file
├── research.md          # Decisions and Rationale
├── data-model.md        # Entities and validation rules
├── quickstart.md        # Testing instructions
└── checklists/          # Requirement quality checklists
```

### Source Code

```text
apps/backend/src/
├── core/
│   ├── use-cases/
│   │   └── register-par.ts       # Main implementation site
│   └── domain/
│       └── client_registry.ts    # Domain entity definition
└── infra/
    ├── http/
    │   └── controllers/
    │       └── par.controller.ts # Transport layer (Zod validation)
    └── adapters/
        └── client_registry.ts    # Mock client data
```

**Structure Decision**: The logic will reside in `RegisterParUseCase` to maintain clean architecture, while keeping the transport-level Zod schema for basic URL format validation.
