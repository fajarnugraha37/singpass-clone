# Implementation Plan: Mock Client Registry — Add Encryption Key

**Branch**: `021-mock-client-enc-key` | **Date**: 2026-03-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/021-mock-client-enc-key/spec.md`

## Summary

The primary requirement is to add a static, hardcoded encryption key (`enc`) to the `mock-client-id` entry in the client registry configuration file. This will resolve the "Client public encryption key not found" error during token exchange and allow the system to return ID Tokens as JWE (JSON Web Encryption) objects using the `ECDH-ES+A256KW` algorithm, as specified in OIDC/FAPI 2.0 standards.

## Technical Context

**Language/Version**: TypeScript / Bun 1.1+  
**Primary Dependencies**: Hono, `jose`, `@vibe-auth/shared`  
**Storage**: JSON/YAML Configuration file (for client registry)  
**Testing**: Bun test  
**Target Platform**: Node.js/Bun (Server-side)
**Project Type**: Web-service (Backend)  
**Performance Goals**: <200ms for token exchange  
**Constraints**: OIDC / FAPI 2.0 Compliance  
**Scale/Scope**: Development/Mock environment usage

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
specs/021-mock-client-enc-key/
├── plan.md              # This file
├── research.md          # Research findings and key generation
├── data-model.md        # ClientConfig entity details
├── quickstart.md        # Verification steps
└── contracts/
    └── id-token.md      # ID Token JWE contract
```

### Source Code (repository root)

```text
apps/backend/
├── src/
│   ├── core/
│   │   ├── application/services/token.service.ts  # Logic for JWE encryption
│   │   ├── utils/crypto.ts                        # Helper for JWS-in-JWE
│   │   └── domain/client_registry.ts              # ClientConfig entity
│   └── infra/
│       └── adapters/client_registry.ts            # TARGET: Mock client configuration
└── tests/
    └── integration/token_exchange_encryption.test.ts # Verification test
```

**Structure Decision**: Option 2: Web application (Backend focus) - Updating the `client_registry.ts` adapter within the backend service to provide the necessary encryption key.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | No violations detected. | N/A |
