# Implementation Plan: Auth Error Redirect Compliance

**Branch**: `014-auth-error-redirect` | **Date**: 2026-03-15 | **Spec**: [specs/014-auth-error-redirect/spec.md]
**Input**: Feature specification from `/specs/014-auth-error-redirect/spec.md`

## Summary
The goal is to implement OIDC-compliant terminal failure redirects for authentication errors (max retries reached). The backend will issue a direct `302 Found` redirect with `error=login_required` and the original `state`. Temporary errors will continue to provide inline feedback via JSON responses. IP-based rate limiting and security audit logging will also be implemented.

## Technical Context

**Language/Version**: TypeScript 5.x / Bun 1.1+  
**Primary Dependencies**: Astro, Hono, Drizzle ORM, Svelte, TailwindCSS, `jose`, `@vibe-auth/shared`  
**Storage**: SQLite (via Drizzle)  
**Testing**: Bun test  
**Target Platform**: Node.js/Bun (Server)
**Project Type**: Web service (Monorepo)  
**Performance Goals**: Minimal latency for rate-limit and retry checks.  
**Constraints**: OIDC/FAPI 2.0 compliance, secure session management.  
**Scale/Scope**: Auth endpoints (login, 2FA), session management, security logging, IP rate limiting.

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
specs/014-auth-error-redirect/
├── plan.md              # This file
├── research.md          # Research findings and decisions
├── data-model.md        # Updated AuthSession entity
├── quickstart.md        # Guide for testing the feature
└── tasks.md             # To be created next phase
```

### Source Code (repository root)

```text
apps/backend/
├── src/
│   ├── core/
│   │   ├── domain/
│   │   │   └── session.ts      # Update AuthSession interface
│   │   └── use-cases/
│   │       ├── ValidateLogin.ts # Increment retries, handle terminal failure
│   │       └── Validate2FA.ts   # Increment retries, handle terminal failure
│   ├── infra/
│   │   ├── adapters/
│   │   │   └── db/
│   │   │       └── drizzle_session_repository.ts # Handle retryCount persistence
│   │   ├── database/
│   │   │   └── schema.ts        # Add retry_count column
│   │   ├── http/
│   │   │   └── controllers/
│   │   │       └── auth.controller.ts # Detect terminal failure and issue 302
│   │   └── middleware/
│   │       └── rate-limiter.ts   # New: IP-based throttling
│   └── index.ts                # Register rate-limiter middleware

apps/frontend/
├── src/
│   ├── components/
│   │   ├── LoginForm.svelte     # Handle backend redirects in fetch
│   │   └── TwoFactorForm.svelte # Handle backend redirects in fetch
```

**Structure Decision**: Monorepo structure with backend (Hono) and frontend (Astro/Svelte) isolated. Backend handles security policy (retries, rate-limiting, audit) while frontend manages UX (inline errors).

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | | |
