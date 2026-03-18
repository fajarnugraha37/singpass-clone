---
description: "Task list for SDP Compliance Fixes implementation"
---

# Tasks: 036-sdp-compliance-fixes

**Input**: Design documents from `/specs/036-sdp-compliance-fixes/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Tests**: Included for critical compliance logic (coverage >= 80%) as per project standards.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- File paths are relative to repository root.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure verification

- [x] T001 Verify project structure for `apps/backend/src/core` and `apps/backend/src/infra`
- [x] T002 [P] Create migration to extend `clients` table and create `user_account_links` in `apps/backend/drizzle/`
- [x] T003 [P] Update `ClientConfig` interface with new fields in `apps/backend/src/core/domain/client_registry.ts`
- [x] T004 Update Drizzle schema definition in `apps/backend/src/infra/adapters/db/schema.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure and utilities that MUST be complete before user stories

- [x] T005 [P] Implement `AuthValidator` utility with IP restriction logic in `apps/backend/src/core/utils/auth_validator.ts`
- [x] T006 [P] Update `ClientRegistry` port to support new fields in `apps/backend/src/core/ports/client_registry.ts`
- [x] T007 Implement schema-aware `DrizzleClientRegistry` in `apps/backend/src/infra/adapters/db/drizzle_client_registry.ts`
- [x] T008 [P] Update shared types in `packages/shared/src/types/client.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 2 - Standards-Based Client Authentication (Priority: P1)

**Goal**: Support JWKS URI for client authentication with caching and Cache-Control respect.

**Independent Test**: Perform PAR with a client using `jwks_uri` and verify successful key retrieval and authentication.

- [x] T009 [P] [US2] Update `JWKSCacheService` to parse `Cache-Control` headers in `apps/backend/src/infra/adapters/jwks_cache.ts`
- [x] T010 [US2] Integrate `JWKSCacheService` into `RegisterParUseCase` in `apps/backend/src/core/use-cases/register-par.ts`
- [x] T011 [US2] Update `TokenService` to use `JWKSCacheService` for client key lookup in `apps/backend/src/core/application/services/token.service.ts`
- [x] T012 [US2] Add unit tests for JWKS TTL parsing in `apps/backend/tests/infra/jwks_cache.test.ts`

---

## Phase 4: User Story 3 - Authorized Scope Access (Priority: P1)

**Goal**: Validate requested scopes against client's `allowedScopes`.

**Independent Test**: Request unauthorized scope in PAR and verify `invalid_scope` error.

- [x] T013 [US3] Implement scope intersection check in `RegisterParUseCase` in `apps/backend/src/core/use-cases/register-par.ts`
- [x] T014 [US3] Add integration tests for scope validation in `apps/backend/tests/integration/par_validation.test.ts`

---

## Phase 5: User Story 1 - Secure and Transparent Login (Priority: P1)

**Goal**: Display the application name on the login page.

**Independent Test**: Initiate auth flow and verify "Log in to [App Name]" is visible on the login page.

- [x] T015 [US1] Update `InitiateAuthSessionUseCase` to include `clientName` in output in `apps/backend/src/core/use-cases/initiate-auth-session.ts`
- [x] T016 [US1] Update `LoginRequest` contract in `packages/shared/src/contracts/auth.ts` (Added `AuthSessionResponse` for `/session` endpoint)
- [x] T017 [US1] Update `login.astro` to fetch and display client name in `apps/frontend/src/pages/login.astro`
- [x] T018 [US1] Pass client name to `LoginHero` component in `apps/frontend/src/components/LoginHero.svelte`

---

## Phase 6: User Story 4 - Validated Redirect URIs (Priority: P2)

**Goal**: Prevent IP-based redirect URIs and site URLs.

**Independent Test**: Attempt to register client with IP-based URL and verify rejection.

- [x] T019 [US4] Enforce IP restriction in `AuthValidator` during client lookup/validation in `apps/backend/src/core/services/auth_validator.ts`
- [x] T020 [US4] Add unit tests for IP address detection regex in `apps/backend/tests/core/validation.test.ts`

---

## Phase 7: User Story 5 - Administrative Transparency & Limits (Priority: P3)

**Goal**: Support admin fields and enforce test account limits.

**Independent Test**: Link 101st account to Staging client and verify failure.

- [x] T021 [US5] Implement account count check in `LinkUserToClientUseCase` in `apps/backend/src/core/use-cases/link-user-to-client.ts`
- [x] T022 [US5] Update management API to return new administrative fields in `apps/backend/src/infra/http/controllers/client.controller.ts`

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements and final validation

- [x] T023 [P] Update technical documentation in `docs/singpass-server/` with new compliance rules
- [x] T024 [P] Verify SC-001 through SC-005 using `specs/036-sdp-compliance-fixes/quickstart.md`
- [x] T025 Run final regression test suite

---

## Dependencies & Execution Order

1. **Phase 1 & 2** are mandatory first steps.
2. **Phase 3 (US2)**, **Phase 4 (US3)**, and **Phase 6 (US4)** are backend-focused and can proceed in parallel once Phase 2 is done.
3. **Phase 5 (US1)** depends on Phase 2 (registry updates).
4. **Phase 7 (US5)** can be done last as per priority.

## Parallel Execution Examples

- **Backend Logic**: T009 (JWKS), T013 (Scopes), T019 (IPs) can be developed simultaneously.
- **Frontend/Backend**: T015 (Backend US1) and T018 (Svelte component) can be worked on in parallel.

## Implementation Strategy

### MVP First (High Priority Compliance)
1. Complete Foundational schema and registry updates (Phase 1 & 2).
2. Implement JWKS URI support and Scope validation (Phase 3 & 4) - critical for security.
3. Implement App Name display (Phase 5) - critical for transparency.

### Incremental Delivery
- Deliver security fixes (US2, US3) first.
- Deliver UX fixes (US1) second.
- Deliver administrative hardening (US4, US5) third.
