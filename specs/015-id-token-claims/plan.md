# Implementation Plan: ID Token Claims

**Branch**: `015-id-token-claims` | **Date**: 2026-03-15 | **Spec**: [/specs/015-id-token-claims/spec.md](spec.md)
**Input**: Feature specification from `/specs/015-id-token-claims/spec.md`

## Summary
The goal is to enhance the ID Token and UserInfo response with mandatory FAPI 2.0 and Singpass-specific claims. This involves extending the session and token data models to track authentication context (LOA and AMR), and implementing a claim mapper to build the `sub_attributes` object based on authorized scopes.

## Technical Context

**Language/Version**: TypeScript 5.x / Bun 1.1+
**Primary Dependencies**: Hono, Drizzle ORM, jose
**Storage**: SQLite
**Testing**: Bun test
**Target Platform**: Node.js / Bun Runtime
**Project Type**: Identity Provider (Web Service)
**Performance Goals**: ID Token and UserInfo generation < 50ms
**Constraints**: Strictly follow Singpass integration guide for claim names and values.
**Scale/Scope**: Impacts Token and UserInfo endpoints.

## Constitution Check

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
specs/015-id-token-claims/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── contracts/           # Phase 1 output
    ├── id-token.md
    └── userinfo-response.md
```

### Source Code (repository root)

```text
apps/backend/
├── src/
│   ├── core/
│   │   ├── application/
│   │   │   └── services/
│   │   │       └── token.service.ts      # Update to include claims in ID Token
│   │   ├── domain/
│   │   │   ├── auth_data_service.ts      # Update interfaces
│   │   │   └── claims.ts                 # New: Claim mapping logic
│   │   └── use-cases/
│   │       ├── token-exchange.ts         # Pass loa/amr to TokenService
│   │       └── get-userinfo.ts           # Build sub_attributes and include acr/amr
│   ├── infra/
│   │   ├── adapters/
│   │   │   └── drizzle_auth_data.ts      # Update to persist amr in sessions
│   │   │   └── db/
│   │   │       └── drizzle_token_repository.ts # Update to persist loa/amr in tokens
│   │   └── database/
│   │       └── schema.ts                 # Add columns to sessions and access_tokens
└── tests/
    └── core/
        └── claims.test.ts                # New tests for claim mapping
```

**Structure Decision**: Option 2: Web application (backend focus for this feature).

## Complexity Tracking

*No violations identified.*
