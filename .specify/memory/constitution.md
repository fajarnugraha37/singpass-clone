<!--
Sync Impact Report:
- Version change: Initial Draft -> 1.0.0
- List of modified principles:
  - Set Principle I: Architecture Design
  - Set Principle II: API Stability
  - Set Principle III: Security Requirements
  - Set Principle IV: Protocol Invariants
  - Set Principle V: AI Model Usage Boundaries
  - Set Principle VI: Documentation Requirements
- Added sections: Development Philosophy & Constraints, Project Goals & Criteria
- Removed sections: N/A
- Templates requiring updates:
  - ✅ .specify/templates/plan-template.md (Updated Constitution Checks)
  - ✅ .specify/templates/spec-template.md (Spec-driven approach naturally complies)
  - ✅ .specify/templates/tasks-template.md (Test-first task structure matches)
- Follow-up TODOs:
  - None (Ratification date set to today, 2026-03-07)
-->
# vibe-auth Constitution

## Core Principles

### I. Architecture Design
The system MUST follow Hexagonal Architecture (Ports and Adapters) to cleanly isolate the core domain from external concerns (database, web frameworks). Code MUST adhere strictly to DRY (Don't Repeat Yourself) and KISS (Keep It Simple, Stupid) principles, avoiding deep nesting, utilizing appropriate design patterns, and avoiding complex logic in a single function. The project runs as a Bun monorepo, separating the frontend (Astro + Tailwind + Svelte islands) and backend (Hono).
*Rationale*: Isolating the domain ensures business logic can be tested independently. Keeping it simple guarantees long-term maintainability.

### II. API Stability
All API communication MUST rely on Hono RPC to share strict TypeScript contracts between the backend and frontend. The API represents a rigid boundary; silent breaking changes to these contracts are prohibited. API responses MUST be predictable, typed, and well-documented.
*Rationale*: End-to-end type safety eliminates entire categories of runtime errors and simplifies frontend consumption.

### III. Security Requirements
Security is the paramount concern, employing a security-first protocol modeling approach to replicate a Singpass-like authentication flow. The system MUST enforce Two-Factor Authentication (2FA) for critical paths, utilize robust session management with strict grace periods, and adhere to OIDC (OpenID Connect) / FAPI 2.0 standards where applicable. Never log or leak sensitive user data or unhashed tokens.
*Rationale*: Identity providers are high-value targets; robust, standards-compliant security is non-negotiable.

### IV. Protocol Invariants
The system MUST maintain strict protocol invariants mirroring Singpass behavior:
1. Seamless transition between passwordless (QR/Push via app) and fallback (Password + 2FA like SMS/OTP).
2. Token exchange and data retrieval MUST follow standard OIDC flows (Authorization Code, Token Exchange, UserInfo retrieval).
*Rationale*: Following proven IAM protocols ensures interoperability and user trust.

### V. AI Model Usage Boundaries
AI tasks MUST follow deterministic execution utilizing smaller, focused models for individual sub-tasks. AI implementations MUST NOT proceed without an explicitly validated architecture step. AI outputs MUST adhere to the testing standards, KISS principle, and code quality limits defined herein.
*Rationale*: Large-scale generation without architectural guardrails leads to unmaintainable tech debt; deterministic, spec-driven steps maintain quality.

### VI. Documentation Requirements
Development strictly adheres to "Documentation First" and "Specification Driven" philosophies. No implementation code is written before the specification, architecture, and contracts are documented, reviewed, and validated. The specification is the absolute single source of truth.
*Rationale*: Documentation is cheaper to change than code and serves as the deterministic blueprint for both AI and human execution.

## Development Philosophy & Constraints

- **Stack Constraints**:
  - **Runtime**: Bun, TypeScript
  - **Backend**: Hono (TypeScript), Drizzle ORM, SQLite
  - **Frontend**: Astro SSG, TailwindCSS, Svelte islands (Design System first)
- **Testing Standards**: Every feature MUST include independent tests per user story before implementation begins. Red-Green-Refactor cycles apply. Code quality and testing standards MUST be rigorously maintained.
- **UX & Performance**: Maintain a highly consistent user experience mirroring Singpass's simplicity and speed. The system must meet strict performance requirements for fast token exchange, minimal latency on UI interactions, and optimized island hydration via Astro.

## Project Goals & Criteria

**Problem Definition**: The need for a centralized identity provider supporting Singpass-like authentication flows to offer client authentication services, simplifying and securing user access across applications.

**System Scope**: Includes OIDC-compliant endpoints, user login flows (passwordless and 2FA via fallback), robust token exchange mechanisms, and a comprehensive, accessible frontend UI functioning as the identity provider interface.

**Success Criteria**:
- Successfully implements the standard Singpass-like authentication journeys (Passwordless and 2FA fallback).
- System functions correctly with Hono backend, SQLite DB, and Astro frontend communicating via Hono RPC.
- All code passes Hexagonal Architecture compliance checks, DRY/KISS code quality gates, and rigorous test coverage.
- The UI strictly adheres to the Design System-first approach, offering consistent UX and meeting performance requirements.

## Governance

- The Constitution supersedes all other practices and ad-hoc conventions.
- Amendments require documentation, team approval, and a migration plan if core invariants or stack dependencies change.
- All Pull Requests MUST be reviewed to verify compliance with Architecture, Security, API Stability principles, and AI usage boundaries.

**Version**: 1.0.0 | **Ratified**: 2026-03-07 | **Last Amended**: 2026-03-07