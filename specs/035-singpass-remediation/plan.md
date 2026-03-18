# Implementation Plan: Singpass Compliance Remediation

**Branch**: `035-singpass-remediation` | **Date**: 2026-03-18 | **Spec**: [/specs/035-singpass-remediation/spec.md]
**Input**: Feature specification from `/specs/035-singpass-remediation/spec.md`

## Summary

This feature addresses multiple security and compliance findings from the Singpass Developer Portal audit. The approach involves extending the `ClientConfig` domain model, updating the `RegisterParUseCase` with strict validation logic for scopes and URLs, and integrating client activation status checks across the OIDC flow.

## Technical Context

**Language/Version**: TypeScript 5.x / Bun 1.1+
**Primary Dependencies**: Hono, Drizzle ORM, Zod, jose
**Storage**: SQLite (via Drizzle)
**Testing**: Bun test
**Target Platform**: Node.js/Bun (Backend)
**Project Type**: Web Service (OIDC Provider)
**Performance Goals**: < 200ms for PAR registration and token exchange.
**Constraints**: Hexagonal Architecture, FAPI 2.0 / OIDC standards, Strict Singpass Contract Mirroring.
**Scale/Scope**: Remediation of 12 audit findings affecting Client Registry and Auth flows.

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
specs/035-singpass-remediation/
â”œâ”€â”€ plan.md              # This file
â”œâ”€â”€ research.md          # Phase 0 output
â”œâ”€â”€ data-model.md        # Phase 1 output
â”œâ”€â”€ quickstart.md        # Phase 1 output
â”œâ”€â”€ checklists/
â”‚   â””â”€â”€ requirements.md  # Spec validation
â””â”€â”€ contracts/           # Phase 1 output
```

### Source Code (repository root)

```text
apps/backend/
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ core/
â”‚   â”‚   â”œâ”€â”€ domain/
â”‚   â”‚   â”‚   â””â”€â”€ client_registry.ts  # Update ClientConfig
â”‚   â”‚   â”œâ”€â”€ use-cases/
â”‚   â”‚   â”‚   â””â”€â”€ register-par.ts      # Add validation & activation checks
â”‚   â”‚   â””â”€â”€ auth/
â”‚   â”‚       â””â”€â”€ validation.ts        # Add IP & Scope validation
â”‚   â”œâ”€â”€ infra/
â”‚       â”œâ”€â”€ adapters/
â”‚       â”‚   â””â”€â”€ client_registry.ts   # Update hardcoded registry
â”‚       â””â”€â”€ database/
â”‚           â””â”€â”€ schema.ts            # Add clients table (remediation)
â””â”€â”€ tests/
    â””â”€â”€ compliance/              # New compliance tests

packages/shared/
â””â”€â”€ src/
    â””â”€â”€ config.ts                # Update parRequestSchema
```

**Structure Decision**: Option 2 (Web application) with updates to both `apps/backend` (logic) and `packages/shared` (schemas).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |
