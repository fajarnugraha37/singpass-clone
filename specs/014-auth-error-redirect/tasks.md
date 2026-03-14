# Tasks: Auth Error Redirect Compliance

**Input**: Design documents from `/specs/014-auth-error-redirect/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md

**Tests**: Testing is MANDATORY per project constitution (80% coverage required). Test tasks are included and should be implemented alongside logic.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 [P] Update `AuthSessionStatus` enum to include `FAILED` in `apps/backend/src/core/domain/session.ts`
- [ ] T002 [P] Update `sharedConfig` to include `MAX_AUTH_RETRIES: 3` in `packages/shared/src/config.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure and data model updates

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T003 Update database schema: add `retryCount` to `authSessions` in `apps/backend/src/infra/database/schema.ts`
- [ ] T004 Run database migrations: `bun run db:generate` and `bun run db:migrate` in `apps/backend/`
- [ ] T005 Update `AuthSession` interface to include `retryCount` in `apps/backend/src/core/domain/session.ts`
- [ ] T006 Update `DrizzleAuthSessionRepository` to persist `retryCount` in `apps/backend/src/infra/adapters/db/drizzle_session_repository.ts`
- [ ] T007 [P] Implement IP-based rate limiting middleware in `apps/backend/src/infra/middleware/rate-limiter.ts`
- [ ] T008 Register rate limiting middleware in `apps/backend/src/index.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Permanent Auth Failure Redirect (Priority: P1) 🎯 MVP

**Goal**: Redirect user back to client with `error=login_required` after 3 failed authentication attempts.

**Independent Test**: Simulate 3 failed login attempts and verify 302 redirect to client's `redirect_uri` with correct parameters.

### Tests for User Story 1

- [ ] T009 [P] [US1] Create unit tests for retry logic and terminal failure in `apps/backend/tests/core/use-cases/ValidateLogin.test.ts`
- [ ] T010 [P] [US1] Create unit tests for retry logic and terminal failure in `apps/backend/tests/core/use-cases/Validate2FA.test.ts`
- [ ] T011 [P] [US1] Create integration test for 302 redirect behavior in `apps/backend/tests/infra/http/auth.controller.test.ts`

### Implementation for User Story 1

- [ ] T012 [US1] Update `ValidateLoginUseCase` to increment `retryCount` and trigger `FAILED` status in `apps/backend/src/core/use-cases/ValidateLogin.ts`
- [ ] T013 [US1] Update `Validate2FAUseCase` to increment `retryCount` and trigger `FAILED` status in `apps/backend/src/core/use-cases/Validate2FA.ts`
- [ ] T014 [US1] Implement `AUTH_TERMINAL_FAILURE` audit logging in `ValidateLoginUseCase` and `Validate2FAUseCase` using `SecurityAuditService`
- [ ] T015 [US1] Update `auth.controller.ts` to fetch PAR payload and issue 302 redirect on `FAILED` status in `apps/backend/src/infra/http/controllers/auth.controller.ts`
- [ ] T016 [US1] Update `LoginForm.svelte` to detect `res.redirected` and perform top-level navigation in `apps/frontend/src/components/LoginForm.svelte`
- [ ] T017 [US1] Update `TwoFactorForm.svelte` to detect `res.redirected` and perform top-level navigation in `apps/frontend/src/components/TwoFactorForm.svelte`

**Checkpoint**: User Story 1 is fully functional and testable independently

---

## Phase 4: User Story 2 - Temporary Auth Failure Feedback (Priority: P2)

**Goal**: Provide JSON error feedback to the user for failed attempts before the retry limit is reached.

**Independent Test**: Enter incorrect credentials once and verify JSON error response is displayed on the UI without redirect.

### Tests for User Story 2

- [ ] T018 [P] [US2] Create unit tests for JSON error responses in `apps/backend/tests/core/use-cases/ValidateLogin.test.ts`
- [ ] T019 [P] [US2] Create unit tests for JSON error responses in `apps/backend/tests/core/use-cases/Validate2FA.test.ts`

### Implementation for User Story 2

- [ ] T020 [US2] Ensure `ValidateLoginUseCase` returns success=false and error message for temporary failures in `apps/backend/src/core/use-cases/ValidateLogin.ts`
- [ ] T021 [US2] Ensure `Validate2FAUseCase` returns success=false and error message for temporary failures in `apps/backend/src/core/use-cases/Validate2FA.ts`

**Checkpoint**: User Story 2 functional; inline feedback working correctly.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and documentation

- [ ] T022 [P] Verify final security audit log entries for terminal failures in SQLite
- [ ] T023 Run full `quickstart.md` validation flow
- [ ] T024 Ensure code coverage for new logic is >= 80% using `bun test --coverage`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Phase 1. Blocks all subsequent phases.
- **User Stories (Phase 3 & 4)**: Depend on Phase 2. US1 is P1 (MVP), US2 is P2.
- **Polish (Phase 5)**: Depends on all user stories.

### Parallel Opportunities

- T001, T002 (Setup)
- T007 (Rate limiter implementation)
- T009, T010, T011 (Tests for US1)
- T018, T019 (Tests for US2)
- Frontend updates (T016, T017) can start once controller contract (T015) is understood.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Setup and Foundational phases.
2. Implement User Story 1 (The core compliance requirement).
3. Validate terminal failure results in 302 redirect with correct OIDC parameters.

### Incremental Delivery

1. Foundation ready (Schema, Repository, Rate Limiter).
2. Terminal Failure Redirect (Compliance requirement).
3. Temporary Failure Feedback (UX refinement).
4. Final Security Audit and Polish.
