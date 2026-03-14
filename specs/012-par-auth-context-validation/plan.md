# Implementation Plan: PAR authentication_context_type Validation

**Branch**: `012-par-auth-context-validation` | **Date**: 2026-03-14 | **Spec**: `/specs/012-par-auth-context-validation/spec.md`
**Input**: Feature specification from `/specs/012-par-auth-context-validation/spec.md`

## Summary
Implement mandatory `authentication_context_type` and optional `authentication_context_message` validation for Pushed Authorization Requests (PAR) in "Login" type applications. This ensures compliance with Singpass anti-fraud requirements. Myinfo apps will be restricted from providing these parameters to maintain strict protocol separation.

## Technical Context

**Language/Version**: TypeScript 5.x / Bun 1.1+  
**Primary Dependencies**: Astro, Hono, Drizzle ORM, Svelte, TailwindCSS, `jose`, `@vibe-auth/shared`  
**Storage**: SQLite (via Drizzle)  
**Testing**: Bun test  
**Target Platform**: Node/Bun environment (Backend), Browser (Frontend)
**Project Type**: Monorepo (Web Application + API)  
**Performance Goals**: <200ms p95 for PAR endpoint.  
**Constraints**: OIDC/FAPI 2.0 compliance, strict Singpass contract mirroring.  
**Scale/Scope**: Singpass-compliant OIDC Provider.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Architecture Check**: Follows Hexagonal Architecture, DRY, KISS. Separates Hono backend from Astro frontend.
- [x] **API Stability Check**: External HTTP contracts EXACTLY mirror Singpass. Internal API uses Hono RPC. Input validation on all endpoints.
- [x] **Security Check**: SQLite cookie-based sessions, 2FA, OIDC/FAPI 2.0. Secrets NEVER logged (or masked).
- [x] **Protocol Check**: Implements proper token exchange and passwordless/fallback flows.
- [x] **Testing Check**: Unit tests exist for all logic, coverage >= 80%.
- [x] **AI Boundaries Check**: Deterministic execution, strictly follows the plan and tasks. MUST utilize local `docs/singpass-server` and `docs/singpass-client` as the primary source of truth.
- [x] **Documentation Check**: Spec-driven and documented before implementation.

## Project Structure

### Documentation (this feature)

```text
specs/012-par-auth-context-validation/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── auth.md          # Updated PAR schema contract
└── tasks.md             # Phase 2 output (to be created)
```

### Source Code (repository root)

```text
packages/shared/
└── src/
    └── config.ts        # Update parRequestSchema and add enums

apps/backend/
├── src/
│   ├── core/
│   │   ├── domain/
│   │   │   ├── client_registry.ts  # Add appType to ClientConfig
│   │   │   └── par.types.ts        # Ensure payload supports context fields
│   │   └── use-cases/
│   │       └── register-par.ts      # Implement conditional validation logic
│   └── infra/
│       └── adapters/
│           └── client_registry.ts   # Update mock data with appType
└── tests/
    └── unit/
        └── use-cases/
            └── register-par-context.test.ts # New tests for context validation
```

**Structure Decision**: Monorepo approach with updates to shared configuration and backend core domain/use-cases.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | | |
