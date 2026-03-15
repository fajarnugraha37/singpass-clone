# Implementation Plan: Singpass Clone Production Hardening

**Branch**: `029-singpass-hardening` | **Date**: 2026-03-16 | **Spec**: [Link to Spec](./spec.md)
**Input**: Feature specification from `/specs/029-singpass-hardening/spec.md`

## Summary

This feature focuses on bringing the Singpass clone implementation to production readiness. It involves scanning the repository for placeholders (`TODO`, `MOCK`, `FIXME`, etc.), automatically replacing them with Singpass-compliant production logic, enforcing OIDC/FAPI 2.0 security invariants, and ensuring all authentication state is persisted in SQLite.

## Technical Context

**Language/Version**: TypeScript 5.x / Bun 1.1+
**Primary Dependencies**: Hono (Backend), Drizzle ORM (Database), `jose` (JWT/JWKS), Astro (Frontend)
**Storage**: SQLite (shared monorepo database)
**Testing**: Bun test (coverage >= 80%)
**Target Platform**: Bun runtime
**Project Type**: Security Hardening / API Compliance
**Performance Goals**: minimal latency on UI interactions, fast token exchange
**Constraints**: External HTTP contracts MUST perfectly mirror Singpass API endpoints.
**Scale/Scope**: Full scan of `apps/backend` and `apps/frontend` for hardening patterns.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Architecture Check**: Follows Hexagonal Architecture, DRY, KISS. The hardening tool will integrate into existing adapters where placeholders exist.
- [x] **API Stability Check**: External HTTP contracts perfectly mirror Singpass. Hardening replaces internal logic while preserving public interfaces.
- [x] **Security Check**: Enforces 2FA, persistent SQLite sessions, OIDC/FAPI 2.0 standards. Secrets are retrieved from environment variables and never logged.
- [x] **Protocol Check**: Maintains transitions between passwordless and fallback flows. Standardizes OIDC/Token Exchange behavior.
- [x] **AI Boundaries Check**: Deterministic execution using local `docs/singpass-server` and `docs/singpass-client` as sources of truth.
- [x] **Documentation Check**: Spec-driven and documented before implementation.

## Project Structure

### Documentation (this feature)

```text
specs/029-singpass-hardening/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output
```

### Affected Areas (Repository)

```text
apps/backend/src/
├── core/                # Domain logic replacement (PKCE, Token validation)
├── adapters/            # Endpoint hardening (Headers, PAR enforcement)
└── db/                  # SQLite schema for persistent auth sessions
apps/frontend/src/
└── ...                  # Removal of devMode/bypassAuth flags
packages/shared/         # Common security types and constants
```

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Automated Hardening Tool | Ensure 100% resolution of all placeholders across the monorepo. | Manual replacement is prone to human error and might miss edge cases. |
| Persistent SQLite PAR state | Compliance with Principle III and FAPI 2.0 durability. | In-memory storage is volatile and would fail SC-006. |
