# Implementation Plan: Remediate Singpass Compliance Audit Findings

**Branch**: `031-fix-singpass-audit` | **Date**: Tuesday, 17 March 2026 | **Spec**: [specs/031-fix-singpass-audit/spec.md](spec.md)
**Input**: Compliance Audit Report: Singpass Integration Guide (v5/FAPI 2.0)

## Summary
Remediate seven security and compliance findings from the Singpass integration audit. This includes shortening PAR `request_uri` TTL to 60s, enforcing a 30-character minimum for `state`/`nonce`, implementing the `DPoP-Nonce` mechanism for freshness, correctly mapping the user's `account_type` in ID Tokens, and adding optional native app launch parameters to the PAR schema.

## Technical Context
- **Language/Version**: TypeScript 5.x / Bun 1.1+
- **Primary Dependencies**: Astro, Hono, Drizzle ORM, Svelte, TailwindCSS, `jose`, `@vibe-auth/shared`
- **Storage**: SQLite (via Drizzle)
- **Testing**: Bun test
- **Target Platform**: Node.js/Bun (Backend), Browser (Frontend)
- **Project Type**: Monorepo (Web Application + API)
- **Performance Goals**: FAPI 2.0 / Singpass standards (fast token exchange)
- **Constraints**: FAPI 2.0 / Singpass compliance
- **Scale/Scope**: Auth server for Singpass integration flows.

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
specs/031-fix-singpass-audit/
├── spec.md              # Feature specification
├── plan.md              # Implementation plan (this file)
├── research.md          # Research findings and decisions
├── data-model.md        # Data entities and validation rules
├── quickstart.md        # Testing and verification guide
└── contracts/           # API contract updates (par.md, token.md)
```

### Source Code (repository root)

```text
apps/backend/
├── src/
│   ├── core/
│   │   ├── use-cases/
│   │   │   ├── register-par.ts
│   │   │   └── token-exchange.ts
│   │   ├── domain/
│   │   │   ├── crypto_service.ts
│   │   │   └── claims.ts
│   │   └── utils/
│   │       └── dpop_validator.ts
│   └── infra/
│       ├── http/
│       │   └── controllers/
│       │       ├── par.controller.ts
│       │       └── token.controller.ts
│       └── middleware/
│           └── fapi-error.ts
└── tests/

packages/shared/
└── src/
    └── config.ts
```

**Structure Decision**: Monorepo split between `apps/backend` (Hono) and `packages/shared` for configurations and types.

## Complexity Tracking

*No Constitution Check violations.*
