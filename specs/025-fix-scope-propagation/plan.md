# Implementation Plan: Scope Propagation Fix

**Branch**: `025-fix-scope-propagation` | **Date**: 2026-03-16 | **Spec**: [specs/025-fix-scope-propagation/spec.md](./spec.md)
**Input**: Feature specification from `/specs/025-fix-scope-propagation/spec.md`

## Summary

The goal of this feature is to ensure that authorized scopes (e.g., `uinfin`, `name`, `email`) from the Pushed Authorization Request (PAR) phase are correctly propagated through the authorization code to the access token. This propagation ensures that the UserInfo endpoint can successfully return the requested PII (Personally Identifiable Information) claims. Currently, the system is reported to miss this propagation at the authorization code phase, resulting in tokens with hardcoded 'openid' scope and empty UserInfo responses.

## Technical Context

**Language/Version**: TypeScript 5.x / Bun 1.1+  
**Primary Dependencies**: Astro, Hono, Drizzle ORM, Svelte, TailwindCSS, `jose`, `@vibe-auth/shared`  
**Storage**: SQLite (via Drizzle)  
**Testing**: Bun test  
**Target Platform**: Web (Hono/Astro)
**Project Type**: Monorepo (Web Application + API)  
**Performance Goals**: OIDC compliant latency (< 200ms p95 for UserInfo)  
**Constraints**: Hexagonal Architecture, FAPI 2.0  
**Scale/Scope**: Singpass-like identity provider

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
specs/025-fix-scope-propagation/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── checklists/          # Feature checklists
│   └── requirements.md  # Specification quality checklist
└── spec.md              # Feature specification
```

### Source Code (repository root)

```text
apps/backend/src/
├── core/
│   ├── domain/
│   │   └── authorizationCode.ts       # Domain interface (M)
│   ├── use-cases/
│   │   ├── GenerateAuthCode.ts         # Logic for code generation (M)
│   │   ├── token-exchange.ts          # Logic for token issuance (M)
│   │   └── get-userinfo.ts            # Logic for claim mapping (V)
│   └── domain/
│       └── userinfo_claims.ts         # Claims mapping logic (V)
├── infra/
│   ├── database/
│   │   ├── schema.ts                  # Drizzle table definitions (M)
│   │   └── cleanup.ts                 # Database cleanup logic (M)
│   └── adapters/
│       └── db/
│           └── drizzle_authorization_code_repository.ts # Repository implementation (M)
└── tests/
    ├── integration/
    │   ├── token-exchange.test.ts     # Update mocks and add tests (M)
    │   └── userinfo.test.ts           # End-to-end verification (M)
    └── repro_scope_propagation.test.ts # New reproduction test case (N)
```

**Structure Decision**: Web application monorepo structure. Updates will focus on the Hono backend's domain, use cases, and database adapters.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |
