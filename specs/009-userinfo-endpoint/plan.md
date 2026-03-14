# Implementation Plan: UserInfo Endpoint

**Branch**: `009-userinfo-endpoint` | **Date**: 2026-03-14 | **Spec**: /specs/009-userinfo-endpoint/spec.md
**Input**: Feature specification from `/specs/009-userinfo-endpoint/spec.md`

## Summary

Implement the `GET /userinfo` endpoint in the Hono backend. This endpoint will validate DPoP-bound access tokens, verify DPoP proofs, and return user identity claims in a signed (JWS) and then encrypted (JWE) format, mirroring the Singpass UserInfo protocol.

## Technical Context

**Language/Version**: TypeScript 5.x / Bun 1.1+
**Primary Dependencies**: Hono, `jose`, Drizzle ORM, `@vibe-auth/shared`
**Storage**: SQLite (via Drizzle)
**Testing**: Bun test
**Target Platform**: Bun (Backend Service)
**Project Type**: Web Service (OIDC API)
**Performance Goals**: Rejection latency < 150ms (SC-002)
**Constraints**: 
- DPoP validation (RFC 9449): Use `JoseCryptoService.validateDPoPProof` and compare `jkt` with access token `cnf.jkt`.
- Nested JWS-in-JWE response: Use `jose.SignJWT` (JWS) followed by `jose.CompactEncrypt` (JWE) for the JWS string payload.
- Singpass `person_info` claim mapping: Map `users` table fields (nric, name, email) to nested `{ value: string }` objects inside `person_info`.
- JWKS Caching: Implement in-memory TTL-based cache for client public encryption keys to meet latency targets.

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
specs/009-userinfo-endpoint/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
apps/backend/
├── src/
│   ├── core/
│   │   ├── domain/      # UserInfo types and logic
│   │   └── use-cases/   # GetUserInfo use case
│   ├── infra/
│   │   ├── api/         # Hono routes for /userinfo
│   │   └── crypto/      # JWE/JWS/DPoP implementations
│   └── index.ts
└── tests/
    ├── core/
    └── infra/
```

**Structure Decision**: Hexagonal Architecture within `apps/backend`. Domain logic in `core/`, framework/crypto adapters in `infra/`.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | | |
