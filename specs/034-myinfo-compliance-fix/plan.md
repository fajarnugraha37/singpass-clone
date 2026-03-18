# Implementation Plan: Singpass MyInfo Compliance Fixes

**Branch**: `034-myinfo-compliance-fix` | **Date**: 2026-03-18 | **Spec**: [specs/034-myinfo-compliance-fix/spec.md]
**Input**: Feature specification from `/specs/034-myinfo-compliance-fix/spec.md`

## Summary

This plan remediates all findings from the MyInfo v5 compliance audit report. We will refactor the `MyinfoValue` interface to make metadata mandatory, update the `regadd` and `vehicles` structures to align with official v5 nesting, and extend the financial and education catalogs. Ascending chronological sorting for CPF contributions will be implemented in the domain/seeding layer.

## Technical Context

**Language/Version**: TypeScript 5.x / Bun 1.1+
**Primary Dependencies**: Hono (Backend), Astro (Frontend), Drizzle ORM, Svelte, `jose`, `@vibe-auth/shared`
**Storage**: SQLite (via Drizzle)
**Testing**: Bun test
**Target Platform**: Node.js / Bun Runtime
**Project Type**: Monorepo (Web Application + API)
**Performance Goals**: < 200ms for UserInfo retrieval (signed/encrypted JWT)
**Constraints**: FAPI 1.0/2.0 Compliance, OIDC Standard
**Scale/Scope**: Singpass MyInfo Data Catalog (Personal, Finance, Vehicle, Education, Property)

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
specs/034-myinfo-compliance-fix/
├── plan.md              # This file
├── research.md          # Decision log (Phase 0)
├── data-model.md        # Entity definitions (Phase 1)
├── quickstart.md        # Implementation summary (Phase 1)
└── contracts/           # Contract definitions (Phase 1)
```

### Source Code (repository root)

```text
apps/backend/
├── src/
│   ├── application/
│   │   └── mappers/myinfo-mapper.ts # Flattening logic updates
│   ├── core/
│   │   ├── domain/myinfo-person.ts  # Default metadata initialization
│   │   └── myinfo/scope_mapper.ts   # Granular scope support
│   └── infra/
│       └── database/seed-myinfo.ts  # Updated mock data seeding
└── tests/
    └── unit/application/mappers/myinfo-mapper.test.ts # Compliance tests

packages/shared/src/types/
└── myinfo-catalog.ts                # Mandatory metadata and catalog types
```

**Structure Decision**: Web application (Option 2), as this remediation primarily targets the Hono backend's MyInfo implementation and the shared types used by both backend and frontend.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Mandatory metadata in domain | Ensures all mock data paths (seed, manual creation) are compliant by default | Optional metadata causes "silent" non-compliance if forgot in specific paths |
