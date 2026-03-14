# Tasks: Access Token Expiry Alignment

**Input**: Design documents from `/specs/017-token-expiry-alignment/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 [P] Verify monorepo workspace links for `@vibe/shared` in `apps/backend/package.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: The configuration MUST be defined before the service can use it.

- [x] T002 Add `ACCESS_TOKEN_LIFESPAN: 1800` to `sharedConfig.SECURITY` in `packages/shared/src/config.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - Standard Token Issuance (Priority: P1) 🎯 MVP

**Goal**: Access tokens MUST return `expires_in: 1800` in the response and have a matching `exp` claim in the ID token.

**Independent Test**: Perform a token exchange and verify `expires_in` is 1800 and ID token `exp` is `iat + 1800`.

### Tests for User Story 1 (Requested in Spec) ⚠️

- [x] T003 [P] [US1] Create integration test for token issuance lifespan in `apps/backend/tests/integration/token_expiry_issuance.test.ts`

### Implementation for User Story 1

- [x] T004 [US1] Update `TokenService.generateTokens` to use `sharedConfig.SECURITY.ACCESS_TOKEN_LIFESPAN` for `expiresIn` variable in `apps/backend/src/core/application/services/token.service.ts`
- [x] T005 [US1] Ensure `expires_in` field in `TokenResponse` matches the configured lifespan in `apps/backend/src/core/application/services/token.service.ts`

**Checkpoint**: User Story 1 functional - tokens are issued with the correct 30-minute lifespan.

---

## Phase 4: User Story 2 - Token Expiration Enforcement (Priority: P2)

**Goal**: Access tokens MUST become invalid exactly 30 minutes (1800s) after issuance.

**Independent Test**: Use a token at the UserInfo endpoint after 1801 seconds and verify it is rejected with "invalid_token".

### Tests for User Story 2 (Requested in Spec) ⚠️

- [x] T006 [P] [US2] Create integration test for token expiration enforcement at UserInfo endpoint in `apps/backend/tests/integration/token_expiry_enforcement.test.ts`

### Implementation for User Story 2

- [x] T007 [US2] Verify `expiresAt` calculation in `apps/backend/src/core/use-cases/token-exchange.ts` correctly uses the 1800s lifespan for persistence
- [x] T008 [US2] Verify token expiration check logic in `apps/backend/src/core/use-cases/get-userinfo.ts`

**Checkpoint**: User Story 2 functional - tokens are strictly enforced to expire after 30 minutes.

---

## Phase 5: User Story 3 - Configurable Expiry (Priority: P3)

**Goal**: System lifespan adjusts dynamically based on `sharedConfig`.

**Independent Test**: Change `ACCESS_TOKEN_LIFESPAN` to `900` and verify tokens are issued with `expires_in: 900`.

### Tests for User Story 3 (Requested in Spec) ⚠️

- [x] T009 [P] [US3] Create integration test for dynamic lifespan configuration in `apps/backend/tests/integration/token_expiry_config.test.ts`

### Implementation for User Story 3

- [x] T010 [US3] Verify that `TokenService` correctly reloads/references the shared configuration for each request in `apps/backend/src/core/application/services/token.service.ts`

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Documentation and final validation

- [x] T011 [P] Update OpenAPI example for `expires_in` to `1800` in `apps/backend/src/infra/http/openapi-spec.ts`
- [x] T012 Run all integration tests in `apps/backend/` and verify coverage >= 80%
- [x] T013 Final verification using `quickstart.md` steps (Verify configuration changes can be applied in under 1 minute)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Initial check.
- **Phase 2 (Foundational)**: MUST complete T002 before Phase 3.
- **Phase 3 (US1)**: Blocks US2 and US3 for full validation, but US2/US3 tests can be written in parallel.
- **Phase N (Polish)**: Final cleanup.

### Parallel Opportunities

- T003, T006, T009 (All test skeletons) can be created in parallel.
- T011 (OpenAPI update) can be done in parallel with implementation.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Add config (T002).
2. Update TokenService (T004).
3. Verify with Test (T003).

### Incremental Delivery

1. Foundation (Phase 2) -> Config available.
2. US1 -> Tokens issued with 1800s (Singpass compliant).
3. US2 -> Enforcement verified.
4. US3 -> Configuration flexibility verified.
