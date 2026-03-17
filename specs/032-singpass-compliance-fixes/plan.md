# Implementation Plan: Singpass Compliance Audit Remediation

**Branch**: `032-singpass-compliance-fixes` | **Date**: 2026-03-18 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification for remediating Singpass audit findings.

## Summary

This plan remediates critical and medium-severity findings from the Singpass compliance audit. The primary focus is on privacy protection (NIRC to UUID migration), informed consent (mandatory PAR `purpose`), and security hardening (DPoP nonce enforcement). Additionally, MyInfo attributes are updated to include standard metadata (source, classification, lastupdated).

## Technical Context

**Language/Version**: TypeScript 5.x / Bun 1.1+  
**Primary Dependencies**: Astro, Hono, Drizzle ORM, Svelte, TailwindCSS, `jose`  
**Storage**: SQLite (via Drizzle)  
**Testing**: Bun test  
**Target Platform**: Web (Mock Singpass OP)
**Project Type**: Monorepo (Web Application + API)  
**Performance Goals**: N/A (Standard mock server expectations)  
**Constraints**: FAPI 2.0 / OIDC Compliance
**Scale/Scope**: Core backend logic refactoring across Use Cases and Mappers.

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
specs/032-singpass-compliance-fixes/
├── plan.md              # This file
├── research.md          # Research findings
├── data-model.md        # Updated database and domain entities
├── quickstart.md        # Verification and execution checklist
├── contracts/           # API contract changes
└── tasks.md             # (Created by /speckit.tasks)
```

### Source Code (repository root)

```text
apps/
├── backend/
│   ├── src/
│   │   ├── core/
│   │   │   ├── use-cases/
│   │   │   │   ├── ValidateLogin.ts      # Update userId to UUID
│   │   │   │   ├── register-par.ts       # Enforce nonce & purpose
│   │   │   │   └── get-userinfo.ts       # Enforce nonce
│   │   │   ├── domain/
│   │   │   │   ├── myinfo-person.ts      # Add metadata fields
│   │   │   │   └── userinfo_claims.ts    # Add metadata fields
│   │   │   └── application/services/
│   │   │       └── token.service.ts      # Verify UUID sub claim
│   │   ├── application/mappers/
│   │   │   └── myinfo-mapper.ts          # Map metadata fields
│   │   ├── infra/
│   │   │   ├── database/
│   │   │   │   └── schema.ts             # Add purpose column
│   │   │   └── http/controllers/
│   │   │       └── par.controller.ts     # Return DPoP-Nonce on errors
│   └── drizzle/                          # Migration for par_requests
└── frontend/
    └── src/
        └── components/                   # Consent UI update for purpose

packages/shared/
└── src/
    ├── config.ts                         # Update parRequestSchema
    └── index.ts                          # Update shared types
```

**Structure Decision**: Option 2: Web application (frontend + backend). The changes are distributed across the Hono backend (core logic, database) and the Astro/Svelte frontend (consent UI).

## Complexity Tracking

*No violations identified.*
