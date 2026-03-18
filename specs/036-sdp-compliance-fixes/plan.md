# Implementation Plan: SDP Compliance Fixes

**Branch**: `036-sdp-compliance-fixes` | **Date**: 2026-03-18 | **Spec**: [specs/036-sdp-compliance-fixes/spec.md](spec.md)
**Input**: Feature specification from `/specs/036-sdp-compliance-fixes/spec.md`

## Summary

Address critical and medium severity compliance gaps identified in the Singpass Developer Portal (SDP) audit. This includes implementing `jwks_uri` support for client authentication, enforcing `allowedScopes` validation, preventing IP-based redirect URIs, and improving UI transparency by displaying the application name during login.

## Technical Context

**Language/Version**: TypeScript 5.x / Bun 1.1+  
**Primary Dependencies**: Astro, Hono, Drizzle ORM, Svelte, TailwindCSS, `jose`  
**Storage**: SQLite (via Drizzle)  
**Testing**: Bun test (unit and integration)  
**Target Platform**: Node.js/Bun runtime (Backend), Modern Browsers (Frontend)
**Project Type**: Monorepo (Web Application + API)  
**Performance Goals**: < 500ms overhead for JWKS fetching; < 150ms for auth rejections.  
**Constraints**: Strict Hexagonal Architecture; OIDC/FAPI 2.0 security standards.  
**Scale/Scope**: Implementation across `apps/backend` (core/infra) and `apps/frontend` (pages/components).

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
specs/036-sdp-compliance-fixes/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── checklists/          # Quality validation checklists
```

### Source Code (repository root)

```text
apps/backend/
├── src/
│   ├── core/
│   │   ├── domain/      # Extended ClientConfig, UserAccount
│   │   ├── use-cases/   # Updated RegisterPar, InitiateAuth, TokenService
│   │   └── services/    # Updated Validation utils
│   ├── infra/
│   │   ├── adapters/    # JWKSCacheService, DB Registry
│   │   └── http/        # Controller/Router updates
│   └── drizzle/         # Migration for schema updates
└── tests/

apps/frontend/
├── src/
│   ├── components/      # Login UI updates
│   └── pages/           # login.astro logic
└── tests/

packages/shared/
└── src/                 # Updated types/contracts
```

**Structure Decision**: Monorepo structure with clear separation between `apps/backend` (Domain and Infra) and `apps/frontend` (UI and Orchestration). Shared types in `packages/shared`.

## Complexity Tracking

*No Constitution Check violations identified.*
