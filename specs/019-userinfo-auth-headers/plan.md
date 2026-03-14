# Implementation Plan: UserInfo `WWW-Authenticate` Headers

**Branch**: `019-userinfo-auth-headers` | **Date**: 2026-03-15 | **Spec**: [/specs/019-userinfo-auth-headers/spec.md](./spec.md)
**Input**: Feature specification from `/specs/019-userinfo-auth-headers/spec.md`

## Summary

The goal is to ensure all 401 Unauthorized responses from the UserInfo endpoint include the required `WWW-Authenticate` header with the `DPoP` scheme and appropriate error parameters. The technical approach involves updating the `getUserInfo` controller in the Hono backend to append this header in the catch block for different authentication failure scenarios (invalid token, invalid DPoP proof, invalid request).

## Technical Context

**Language/Version**: TypeScript 5.x / Bun 1.1+
**Primary Dependencies**: Hono, `@vibe-auth/shared`, `jose`
**Storage**: SQLite (via Drizzle)
**Testing**: Bun test
**Target Platform**: Node.js/Bun (Backend)
**Project Type**: Web-service (API)
**Performance Goals**: < 200ms p95 response time for UserInfo requests
**Constraints**: Must strictly follow RFC 9449 and Singpass specifications for DPoP challenges.
**Scale/Scope**: Single endpoint (`/api/userinfo`) enhancement.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Architecture Check**: Follows Hexagonal Architecture by placing HTTP-specific header logic in the controller adapter.
- [x] **API Stability Check**: HTTP contracts precisely follow Singpass/RFC requirements for error headers.
- [x] **Security Check**: Enhances security transparency for client-side error handling while maintaining secure token validation.
- [x] **Protocol Check**: Implements OIDC/DPoP compliant error challenges.
- [x] **Testing Check**: Planned unit tests for all header permutations.
- [x] **AI Boundaries Check**: Deterministic implementation based on local documentation.
- [x] **Documentation Check**: Spec, research, and contracts are documented before implementation.

## Project Structure

### Documentation (this feature)

```text
specs/019-userinfo-auth-headers/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Decisions and rationale
├── data-model.md        # Relevant data structures
├── quickstart.md        # Testing and verification guide
└── contracts/           
    └── userinfo-auth.md # HTTP response contract for 401 errors
```

### Source Code (repository root)

```text
apps/backend/
├── src/
│   ├── infra/
│   │   ├── http/
│   │   │   ├── controllers/
│   │   │   │   └── userinfo.controller.ts # Target for modification
└── tests/
    ├── infra/
    │   ├── http/
    │   │   ├── controllers/
    │   │   │   └── userinfo.controller.test.ts # Target for tests
```

**Structure Decision**: Standard monorepo structure with backend logic in `apps/backend`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

(No violations identified)
