# Implementation Plan: Secure JWKS Public Key Export

**Branch**: `011-secure-jwks-export` | **Date**: 14 March 2026 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/011-secure-jwks-export/spec.md`

## Summary

This plan addresses a critical security finding where the JWKS endpoint (`/.well-known/keys`) was exposing private key components. The fix involves modifying the key export logic in `JoseCryptoService` to programmatically strip all private parameters from the JSON Web Keys before they are returned. A new unit test will be added to enforce this security control.

## Technical Context

**Language/Version**: TypeScript 5.x / Bun 1.1+  
**Primary Dependencies**: Hono, `jose`
**Storage**: N/A
**Testing**: Bun test
**Target Platform**: Backend API
**Project Type**: Monorepo (Web Application + API)  
**Performance Goals**: N/A
**Constraints**: Must adhere to OIDC RFC 7517 for JWK Sets.
**Scale/Scope**: The fix is targeted at the `getPublicJWKS()` method within `JoseCryptoService`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Architecture Check**: Follows Hexagonal Architecture, DRY, KISS. Consistent coding conventions. Separates Hono backend from Astro frontend.
- [x] **API Stability Check**: External HTTP contracts EXACTLY mirror Singpass. Internal API uses Hono RPC. Input validation on all endpoints.
- [x] **Security Check**: SQLite cookie-based sessions, 2FA, OIDC/FAPI 2.0. Secrets NEVER logged (or masked).
- [x] **Protocol Check**: Implements proper token exchange and passwordless/fallback flows.
- [x] **Testing Check**: Unit tests exist for all logic, coverage >= 80%.
- [x] **AI Boundaries Check**: Deterministic execution, strictly follows the plan and tasks. MUST utilize local `docs/singpass-server` and `docs/singpass-client` as the primary source of truth.
- [x] **Documentation Check**: Spec-driven and documented before implementation.

*All initial constitution checks pass. No violations.*

## Project Structure

### Documentation (this feature)

```text
specs/011-secure-jwks-export/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── oidc-jwks.md
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by this command)
```

### Source Code (repository root)

The changes will occur within the existing backend application structure.

```text
apps/
└── backend/
    └── src/
        └── core/
            └── services/
                └── jose-crypto-service.ts  # <-- Modification here
    └── tests/
        └── core/
            └── services/
                └── jose-crypto-service.test.ts # <-- New test here
```

**Structure Decision**: The implementation will modify one existing service file and add a corresponding test file, fitting within the established project structure. No new files outside of the test suite are required.

## Complexity Tracking

No complexity tracking is needed as there are no violations of the constitution.
