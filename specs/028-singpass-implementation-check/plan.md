# Implementation Plan: Singpass Implementation Conformance Auditor

**Branch**: `028-singpass-implementation-check` | **Date**: 2026-03-16 | **Spec**: [Link to Spec](./spec.md)
**Input**: Feature specification from `/specs/028-singpass-implementation-check/spec.md`

## Summary

Build an auditor CLI tool that automatically tests a target "Singpass clone" IDP implementation for conformance to the official Singpass Login and MyInfo integration specs. The tool evaluates PAR enforcement, PKCE/DPoP validation, Token Exchange, and ID Token formatting. It is implemented as a standalone Bun package (`packages/conformance`).

## Technical Context

**Language/Version**: TypeScript 5.x / Bun 1.1+
**Primary Dependencies**: `bun:test` (runner), `jose` (JWT/JWKS processing), native `fetch`
**Storage**: N/A (stateless runtime tool)
**Testing**: Bun test (for the tool's own logic)
**Target Platform**: Node/Bun CLI environment
**Project Type**: CLI Tool / Conformance Suite
**Performance Goals**: Execute full conformance run in < 5 minutes
**Constraints**: Must run locally or against remote staging environments
**Scale/Scope**: ~10 automated OIDC tests mapping to Singpass integration guide

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Architecture Check**: Follows Hexagonal Architecture, DRY, KISS. Consistent coding conventions. Separates Hono backend from Astro frontend. (The tool is an isolated package to maintain isolation).
- [x] **API Stability Check**: External HTTP contracts EXACTLY mirror Singpass. Internal API uses Hono RPC. Input validation on all endpoints. (This tool ensures the clone adheres to the contracts).
- [x] **Security Check**: SQLite cookie-based sessions, 2FA, OIDC/FAPI 2.0. Secrets NEVER logged (or masked). (The tool will mask secrets in its final report output).
- [x] **Protocol Check**: Implements proper token exchange and passwordless/fallback flows. (The tool verifies these flows).
- [x] **Testing Check**: Unit tests exist for all logic, coverage >= 80%.
- [x] **AI Boundaries Check**: Deterministic execution, strictly follows the plan and tasks. MUST utilize local `docs/singpass-server` and `docs/singpass-client` as the primary source of truth.
- [x] **Documentation Check**: Spec-driven and documented before implementation.

## Project Structure

### Documentation (this feature)

```text
specs/028-singpass-implementation-check/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
packages/conformance/
├── package.json
├── src/
│   ├── cli.ts             # Entrypoint parsing arguments
│   ├── runner.ts          # Core execution logic
│   ├── checks/            # Individual test check implementations (PAR, PKCE, etc)
│   ├── reporters/         # Output formatters (markdown, json, console)
│   └── utils/             # Helpers for HTTP, crypto (jose)
└── tests/
    └── runner.test.ts     # Tests for the auditor logic
```

**Structure Decision**: A new isolated package `packages/conformance` has been chosen. This avoids bloating the production backend dependencies and keeps testing logic separate, treating the IDP purely as an external black box target.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| New Monorepo Package (`packages/conformance`) | Need a standalone CLI tool to act as a client testing the server. | Placing tests in `apps/backend/tests` blurs the line between internal unit tests and external black-box conformance testing. |
