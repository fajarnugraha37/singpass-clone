# Implementation Plan: DPoP Validator Consolidation

**Branch**: `020-dpop-consolidation` | **Date**: 2026-03-15 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/020-dpop-consolidation/spec.md`

## Summary

Consolidate three disparate DPoP validation implementations into a single, strict `DPoPValidator` in `apps/backend/src/core/utils/dpop_validator.ts`. The implementation will enforce exact `htu` (HTTP URI) matching and robust `jti` (JWT ID) replay protection across all protected endpoints (PAR, Token, UserInfo). This involves deleting `dpop.ts` and removing DPoP logic from `CryptoService`.

## Technical Context

**Language/Version**: TypeScript 5.x / Bun 1.1+  
**Primary Dependencies**: Hono (Backend Framework), `jose` (JWT/JWS), `@vibe-auth/shared`  
**Storage**: SQLite (via Drizzle) for JTI replay protection persistence (or in-memory cache with TTL if performance dictates)  
**Testing**: Bun test (Unit and Integration)  
**Target Platform**: Node.js/Bun Server Environment  
**Project Type**: Web-service (Monorepo Backend)  
**Performance Goals**: < 10ms overhead for DPoP validation; Support for high-concurrency JTI checks  
**Constraints**: RFC 9449 compliance (Strict HTU matching); Exact mirror of Singpass security behavior  
**Scale/Scope**: Unified validation for PAR, Token, and UserInfo endpoints; Affects `apps/backend`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Architecture Check**: Follows Hexagonal Architecture (Ports and Adapters). Consolidating utility logic into a single validator adheres to DRY/KISS.
- [x] **API Stability Check**: Internal API consistency maintained via centralization. External behavior (DPoP) will be stricter and more standards-compliant.
- [x] **Security Check**: Enforces OIDC/FAPI 2.0 (DPoP). Replay protection (JTI) is a key requirement.
- [x] **Protocol Check**: Implements proper token exchange security invariants.
- [x] **Testing Check**: Unit tests required for all validation logic (HTU matching, JTI tracking).
- [x] **AI Boundaries Check**: Deterministic execution, following the plan. Utilizes local `docs/` for Singpass context.
- [x] **Documentation Check**: Spec-driven and documented before implementation.

## Project Structure

### Documentation (this feature)

```text
specs/020-dpop-consolidation/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0: DPoP validation and JTI storage strategy
├── data-model.md        # Phase 1: JTI storage schema
├── quickstart.md        # Phase 1: How to verify consolidation
├── contracts/           # Phase 1: DPoP Validator interface
└── tasks.md             # Phase 2: Implementation tasks
```

### Source Code (repository root)

```text
apps/backend/
├── src/
│   ├── core/
│   │   ├── utils/
│   │   │   ├── dpop_validator.ts   # Unified validator (TARGET)
│   │   │   └── dpop.ts             # DELETED
│   │   └── services/
│   │       └── crypto_service.ts    # REMOVE DPoP logic
│   └── infra/
│       └── adapters/
│           └── jose_crypto.ts       # REMOVE DPoP logic
└── tests/
    └── unit/
        └── dpop_validator.test.ts   # NEW comprehensive tests
```

**Structure Decision**: Monorepo Backend (`apps/backend`) focused. Logic centralized in `core/utils`.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | No violations detected. | |
