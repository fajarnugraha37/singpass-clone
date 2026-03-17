# Implementation Plan: Singpass Compliance Remediation

**Branch**: `033-singpass-compliance-remediation` | **Date**: 2026-03-18 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/033-singpass-compliance-remediation/spec.md`

## Summary

Remediate Singpass compliance findings identified in the audit report to ensure alignment with Singpass Login and MyInfo v5 specifications. The implementation focuses on:
1.  **Purpose Limitation**: Adding `purpose` parameter support in PAR and displaying it during user consent.
2.  **DPoP Replay Protection**: Implementing the `DPoP-Nonce` mechanism in PAR and Token endpoints.
3.  **Data Integrity**: Enhancing MyInfo attributes with standard metadata (`source`, `classification`, `lastupdated`).
4.  **Privacy**: Migrating the `sub` claim from NRIC to database-generated UUIDs.

The approach involves updating the shared `parRequestSchema`, extending the `PushedAuthorizationRequest` and `MyinfoPerson` entities, and modifying core use cases (`RegisterPar`, `ValidateLogin`, `TokenService`) to handle the new requirements while maintaining Hexagonal Architecture and FAPI 2.0 standards.

## Technical Context

**Language/Version**: TypeScript 5.x / Bun 1.1+  
**Primary Dependencies**: Astro, Hono, Drizzle ORM, Svelte, TailwindCSS, `jose`, `@vibe-auth/shared`  
**Storage**: SQLite (via Drizzle)  
**Testing**: Bun test  
**Target Platform**: Node.js/Bun (Backend), Browser (Frontend)
**Project Type**: Monorepo (Web Application + API)  
**Performance Goals**: Fast token exchange, minimal latency on UI interactions.  
**Constraints**: Hexagonal Architecture, FAPI 2.0 / DPoP compliance, Singpass protocol invariants.  
**Scale/Scope**: Singpass clone with OIDC/FAPI 2.0 support.

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
specs/033-singpass-compliance-remediation/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── api.md           # API contract updates
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
apps/backend/
├── src/
│   ├── core/
│   │   ├── use-cases/   # RegisterPar, ValidateLogin
│   │   ├── domain/      # PushedAuthorizationRequest, MyinfoPerson
│   │   └── utils/       # DPoPValidator
│   ├── infra/
│   │   ├── http/        # Controllers (PAR, Token)
│   │   └── db/          # Schema updates
│   └── application/
│       └── mappers/     # MyInfo mapper
└── tests/

apps/frontend/
├── src/
│   └── components/      # Consent UI updates
└── tests/

packages/shared/
└── src/
    └── config.ts        # parRequestSchema updates
```
**Structure Decision**: Monorepo structure with separated Backend (Hono) and Frontend (Astro). Shared logic resides in `packages/shared`. This follows the established project architecture.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |

|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
