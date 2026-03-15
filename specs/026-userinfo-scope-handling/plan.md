# Implementation Plan: UserInfo Scope Handling

**Branch**: `026-userinfo-scope-handling` | **Date**: 2026-03-16 | **Spec**: [specs/026-userinfo-scope-handling/spec.md](spec.md)
**Input**: Feature specification for extending UserInfo and ID Token scope handling.

## Summary

This feature extends the system's identity data exposure capabilities to include the `mobileno` scope and refine the `user.identity` scope handling in compliance with Singpass FAPI 2.0 standards. The technical approach involves updating the domain mapping logic in `userinfo_claims.ts` and `claims.ts` to strictly handle scope-based filtering and the specific nesting requirements of the `person_info` object (UserInfo) versus the `sub_attributes` claim (ID Token).

## Technical Context

**Language/Version**: TypeScript 5.x / Bun 1.1+  
**Primary Dependencies**: Drizzle ORM, Hono, jose  
**Storage**: SQLite (via Drizzle)  
**Testing**: Bun test  
**Target Platform**: Web (Backend)
**Project Type**: Web Service (Identity Provider)  
**Performance Goals**: UserInfo response < 200ms  
**Constraints**: FAPI 2.0 / Singpass compatibility  
**Scale/Scope**: Auth flow extension

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Architecture Check**: Follows Hexagonal Architecture, DRY, KISS. Separates Hono backend from Astro frontend.
- [x] **API Stability Check**: External HTTP contracts EXACTLY mirror Singpass. Internal API uses Hono RPC. Input validation on all endpoints.
- [x] **Security Check**: SQLite cookie-based sessions, 2FA, OIDC/FAPI 2.0. Secrets NEVER logged (or masked).
- [x] **Protocol Check**: Implements proper token exchange and passwordless/fallback flows.
- [x] **Testing Check**: Unit tests exist for all logic, coverage >= 80%.
- [x] **AI Boundaries Check**: Deterministic execution, strictly follows the plan and tasks. MUST utilize local `docs/singpass-server` and `docs/singpass-client` as the primary source of truth.
- [x] **Documentation Check**: Spec-driven and documented before implementation.

## Project Structure

### Documentation (this feature)

```text
specs/026-userinfo-scope-handling/
├── plan.md              # This file
├── research.md          # Current state analysis and technical decisions
├── data-model.md        # Mapping matrix and validation rules
├── quickstart.md        # Verification guide
├── contracts/           # UserInfo and ID Token response structures
└── tasks.md             # Implementation tasks
```

### Source Code (repository root)

```text
apps/backend/
├── src/
│   ├── core/
│   │   ├── domain/
│   │   │   ├── claims.ts           # sub_attributes mapping logic
│   │   │   └── userinfo_claims.ts  # UserInfo specific claims and person_info nesting
│   │   ├── application/
│   │   │   └── services/
│   │   │       └── token.service.ts # ID Token creation
│   │   └── use-cases/
│   │       └── get-userinfo.ts      # UserInfo endpoint logic
│   └── infra/
│       └── database/
│           └── schema.ts            # (Already includes mobileno)
└── tests/
    └── core/
        ├── claims.test.ts           # Unit tests for buildSubAttributes
        └── claims_filtering.test.ts # Unit tests for mapUserInfoClaims
```

**Structure Decision**: Standard Hexagonal structure within the existing backend application.

## Complexity Tracking

*No violations.*
