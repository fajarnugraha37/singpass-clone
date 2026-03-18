# Implementation Plan: Singpass QR Authentication Flow

**Branch**: `039-singpass-qr-auth` | **Date**: 2026-03-19 | **Spec**: [/specs/039-singpass-qr-auth/spec.md](./spec.md)
**Input**: Feature specification from `/specs/039-singpass-qr-auth/spec.md`

## Summary
Implement a production-ready Singpass QR authentication flow using OIDC/FAPI 2.0 Pushed Authorization Requests (PAR). The backend will handle the PAR request and OIDC callback, while the Svelte 5 frontend will manage a real-time QR code lifecycle using runes and Long Polling for status updates.

## Technical Context

**Language/Version**: TypeScript 5.x / Bun 1.1+  
**Primary Dependencies**: Hono, Astro, Svelte 5, Drizzle ORM, `jose` (for JWT/JWS/JWE), `@vibe-auth/shared`  
**Storage**: SQLite (via Drizzle)  
**Testing**: Bun test, Svelte Testing Library  
**Target Platform**: Web Browser (Desktop/Mobile)  
**Project Type**: Web Application (Full-stack Monorepo)  
**Performance Goals**: < 1s QR generation, < 2s redirect after mobile authorization  
**Constraints**: FAPI 2.0 Security Profile, Singpass NDI API contracts  
**Scale/Scope**: Singpass Login / Myinfo (v5) clients  

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
specs/039-singpass-qr-auth/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output: QR generation & polling mechanism
├── data-model.md        # Phase 1 output: QRSessions table
├── quickstart.md        # Phase 1 output: Developer guide
├── contracts/           
│   └── api-contracts.md # Phase 1 output: Hono RPC endpoints
└── checklists/          
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```text
apps/backend/src/
├── controllers/
│   └── singpass-qr.controller.ts  # Handles init & polling
├── adapters/
│   └── singpass-ndi.adapter.ts    # Encapsulates PAR & Token calls
└── services/
    └── qr-auth.service.ts         # Core logic for QRSession management

apps/frontend/src/
├── components/
│   └── QRAuth.svelte              # Svelte 5 QR component with runes
└── lib/
    └── singpass-polling.ts        # Long polling utility

packages/shared/src/
├── schema.ts                      # QRSessions table definition
└── rpc-types.ts                   # Type definitions for Hono RPC
```

**Structure Decision**: Web application (monorepo). Logic is split between `apps/backend` (Hono) and `apps/frontend` (Astro/Svelte) with shared schemas in `packages/shared`.

## Complexity Tracking

*No violations to track. The plan strictly follows the Constitution.*
