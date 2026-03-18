# Implementation Plan: Unified HTTPS Architecture

**Branch**: `038-unified-https-arch` | **Date**: 2026-03-19 | **Spec**: [/specs/038-unified-https-arch/spec.md](spec.md)
**Input**: Feature specification from `/specs/038-unified-https-arch/spec.md`

## Summary

Transition the vibe-auth monorepo to a unified HTTPS architecture where the Hono backend serves as the primary entry point on ports 80 (redirect) and 443 (TLS). The architecture includes automated self-signed certificate generation for local development and integration of the Astro frontend as static assets served by Hono.

## Technical Context

**Language/Version**: TypeScript 5.x / Bun 1.1+
**Primary Dependencies**: Hono, Astro, Svelte, TailwindCSS, `jose`, `selfsigned`
**Storage**: SQLite (via Drizzle) for session persistence (existing)
**Testing**: Bun test
**Target Platform**: Bun Runtime (Linux/macOS/Windows)
**Project Type**: Web Service (Hono) + Web Application (Astro)
**Performance Goals**: <200ms API latency, instant HTTP->HTTPS redirection
**Constraints**: MUST use port 443 for HTTPS and port 80 for HTTP; MUST maintain Hexagonal Architecture
**Scale/Scope**: Monorepo-wide (apps/backend, apps/frontend, packages/shared)

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
specs/038-unified-https-arch/
â”œâ”€â”€ plan.md              # This file
â”œâ”€â”€ research.md          # Phase 0 output
â”œâ”€â”€ data-model.md        # Phase 1 output
â”œâ”€â”€ quickstart.md        # Phase 1 output
â”œâ”€â”€ contracts/           # Phase 1 output
â””â”€â”€ tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
apps/
â”œâ”€â”€ backend/
â”‚   â”œâ”€â”€ src/
â”‚   â”‚   â”œâ”€â”€ infrastructure/
â”‚   â”‚   â”‚   â””â”€â”€ http/        # Server entry & TLS logic
â”‚   â”‚   â””â”€â”€ index.ts         # Hono entry point
â”‚   â””â”€â”€ .ssl/                # Generated certificates
â””â”€â”€ frontend/
    â”œâ”€â”€ dist/                # Static build output
    â””â”€â”€ astro.config.mjs     # Build config update
```

**Structure Decision**: Web application monorepo structure. Backend (Hono) serves as the host for Frontend (Astro) static assets.

## Unknowns Resolved

- **C1: Automated TLS Generation Library**: Use `selfsigned` npm package for pure JS, portable X.509 cert generation.
- **C2: Bun.serve configuration for multiple ports**: Start two `Bun.serve` instances: Port 443 for HTTPS (main app) and Port 80 for HTTP (redirect).
- **C3: Static file serving middleware for Hono in Bun**: Use `hono/bun`'s `serveStatic` with `root: '../frontend/dist'`.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | | |
