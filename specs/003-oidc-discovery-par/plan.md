# Implementation Plan: OIDC Discovery and PAR Endpoint Implementation

**Branch**: `003-oidc-discovery-par` | **Date**: 2026-03-08 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-oidc-discovery-par/spec.md`

## Summary

Implement the public OIDC configuration (`/.well-known/openid-configuration`), JWKS endpoint (`/.well-known/keys`), and the secure FAPI 2.0 Pushed Authorization Request (`/par`) endpoint to perfectly mirror Singpass behavior. The PAR endpoint will strictly validate assertions, PKCE, DPoP, and Singpass-specific parameters before temporarily storing the request in SQLite.

## Technical Context

**Language/Version**: TypeScript 5.x / Bun 1.1+
**Primary Dependencies**: Hono (Backend API), Drizzle ORM, `jose` (Cryptography)
**Storage**: SQLite (via Drizzle)
**Testing**: Bun test
**Target Platform**: Linux Server / Node environment
**Project Type**: Web Service / API Backend
**Performance Goals**: <50ms for discovery/keys endpoints, <100ms for PAR endpoint (DB write + Crypto verify)
**Constraints**: Must perfectly mirror Singpass FAPI 2.0 API contracts, secrets must never be logged.
**Scale/Scope**: Moderate volume of PAR requests. Passive cleanup strategy via TTL.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [ ] **Architecture Check**: Follows Hexagonal Architecture, DRY, KISS. Consistent coding conventions. Separates Hono backend from Astro frontend.
- [ ] **API Stability Check**: External HTTP contracts EXACTLY mirror Singpass. Internal API uses Hono RPC. Input validation on all endpoints.
- [ ] **Security Check**: SQLite cookie-based sessions, 2FA, OIDC/FAPI 2.0. Secrets NEVER logged (or masked).
- [ ] **Protocol Check**: Implements proper token exchange and passwordless/fallback flows.
- [ ] **Testing Check**: Unit tests exist for all logic, coverage >= 80%.
- [ ] **AI Boundaries Check**: Deterministic execution, strictly follows the plan and tasks. MUST utilize local `docs/singpass-server` and `docs/singpass-client` as the primary source of truth.
- [ ] **Documentation Check**: Spec-driven and documented before implementation.

## Project Structure

### Documentation (this feature)

```text
specs/003-oidc-discovery-par/
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
│   │   ├── domain/       # Types and interfaces for PAR
│   │   └── use-cases/    # PAR registration logic
│   ├── infra/
│   │   ├── http/
│   │   │   ├── controllers/ # Hono route handlers
│   │   │   └── validators/  # Input validation schemas (zod)
│   │   └── data/
│   │       └── schema.ts    # Drizzle schema additions
└── tests/
    └── core/
        └── use-cases/
```

**Structure Decision**: The implementation will reside in the `apps/backend` package, adhering to the existing Hexagonal Architecture structure by separating HTTP delivery (Hono), use-case logic, and infrastructure details (Drizzle).
