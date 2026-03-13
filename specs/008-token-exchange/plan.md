# Implementation Plan: FAPI 2.0 Token Exchange Endpoint

**Branch**: `008-token-exchange` | **Date**: 2026-03-14 | **Spec**: [specs/008-token-exchange/spec.md](./spec.md)
**Input**: Feature specification from `/specs/008-token-exchange/spec.md`

## Summary

Implementation of a FAPI 2.0 compliant `POST /token` endpoint for `vibe-auth`. The endpoint will support the `authorization_code` grant type, utilizing `private_key_jwt` for client authentication and DPoP for token binding. ID tokens will be signed (JWS) and encrypted (JWE) as per Singpass requirements.

## Technical Context

**Language/Version**: TypeScript 5.x / Bun 1.1+
**Primary Dependencies**: Hono, Drizzle ORM, `jose` (for JWT/JWE/JWS), `@vibe-auth/shared`
**Storage**: SQLite (via Drizzle)
**Testing**: Bun test
**Target Platform**: Bun Runtime (Linux/Server)
**Project Type**: Web service (Backend)
**Performance Goals**: Token exchange in under 300ms (SC-002)
**Constraints**: FAPI 2.0 security profile, mandatory JWE for ID tokens, DPoP binding, < 200ms p95 for DB lookups.
**Scale/Scope**: Core authentication endpoint for identity provider service.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Architecture Check**: Follows Hexagonal Architecture, DRY, KISS. Consistent coding conventions. Separates Hono backend from Astro frontend.
- [x] **API Stability Check**: External HTTP contracts EXACTLY mirror Singpass. Internal API uses Hono RPC. Input validation on all endpoints.
- [x] **Security Check**: SQLite cookie-based sessions, 2FA, OIDC/FAPI 2.0. Secrets NEVER logged (or masked).
- [x] **Protocol Check**: Implements proper token exchange and passwordless/fallback flows.
- [x] **Testing Check**: Unit tests exist for all logic, coverage >= 80%.
- [x] **AI Boundaries Check**: Deterministic execution, strictly follows the plan and tasks. MUST utilize local `docs/singpass-server` and `docs/singpass-client` as the primary source of truth.
- [x] **Documentation Check**: Spec-driven and documented before implementation.

Phase 0 Research: ✅ complete in [research.md](./research.md)
Phase 1 Design: ✅ complete in [data-model.md](./data-model.md) and [contracts/](./contracts/)
Phase 1 Quickstart: ✅ complete in [quickstart.md](./quickstart.md)

## Project Structure

### Documentation (this feature)

```text
specs/008-token-exchange/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
apps/backend/
├── src/
│   ├── core/           # Domain logic, ports
│   ├── infra/          # Adapters (drizzle, hono)
│   └── index.ts        # Entry point
└── tests/

packages/shared/
└── src/                # Shared schemas and types
```

**Structure Decision**: Monorepo structure with backend logic isolated in `apps/backend` following Hexagonal Architecture. Shared types in `packages/shared`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
