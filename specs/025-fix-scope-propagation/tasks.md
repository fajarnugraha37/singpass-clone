# Tasks: Scope Propagation Fix

**Input**: Design documents from `/specs/025-fix-scope-propagation/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Tests**: Test tasks are included as requested by the feature specification and technical finding for reproduction and verification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app (Backend)**: `apps/backend/src/`, `apps/backend/tests/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Confirm active branch is `025-fix-scope-propagation` and environment is ready
- [ ] T002 [P] Create reproduction test case for missing scopes in `apps/backend/tests/repro_scope_propagation.test.ts`
- [ ] T003 Verify reproduction test FAILS (confirming the bug)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure and database changes that MUST be complete before user stories

- [ ] T004 [P] Update `AuthorizationCode` interface to include `scope: string` in `apps/backend/src/core/domain/authorizationCode.ts`
- [ ] T005 Update `authorizationCodes` table definition in `apps/backend/src/infra/database/schema.ts` (ensure `scope` is present and remove redundant `authCodes` table)
- [ ] T006 Update `cleanup.ts` to use `authorizationCodes` table instead of `authCodes` in `apps/backend/src/infra/database/cleanup.ts`
- [ ] T007 Update `DrizzleAuthorizationCodeRepository` to handle `scope` persistence in `apps/backend/src/infra/adapters/db/drizzle_authorization_code_repository.ts`
- [ ] T008 [P] Update `GenerateAuthCodeUseCase` to read scope from `parRequest.payload.scope` and store it in the auth code in `apps/backend/src/core/use-cases/GenerateAuthCode.ts`
- [ ] T009 [P] Update `TokenExchangeUseCase` to use `authCode.scope` for ID Token generation and Access Token storage in `apps/backend/src/core/use-cases/token-exchange.ts`

**Checkpoint**: Foundation ready - Database and core use cases updated to support scope propagation.

---

## Phase 3: User Story 1 - Full Scope Propagation (Priority: P1) 🎯 MVP

**Goal**: Ensure scopes from PAR are stored in Access Token and used by UserInfo endpoint.

**Independent Test**: Run end-to-end integration test with specific scopes (e.g., `uinfin`) and verify UserInfo returns the data.

### Tests for User Story 1

- [ ] T010 [P] [US1] Update integration test mocks in `apps/backend/tests/integration/token-exchange.test.ts` to include `scope` in `getByCode` mock
- [ ] T011 [US1] Create end-to-end integration test for scope propagation in `apps/backend/tests/integration/userinfo_scope.test.ts`

### Implementation for User Story 1

- [ ] T012 [US1] Verify `TokenExchangeUseCase` correctly persists `scope` in `saveAccessToken` and `saveRefreshToken` via the repository
- [ ] T013 [US1] Verify `GetUserInfoUseCase` correctly retrieves and splits `tokenData.scope` for claim mapping in `apps/backend/src/core/use-cases/get-userinfo.ts`
- [ ] T014 [US1] Verify `mapUserInfoClaims` correctly filters claims based on the provided scopes in `apps/backend/src/core/domain/userinfo_claims.ts`

**Checkpoint**: User Story 1 functional - Access tokens now correctly carry scopes for data retrieval.

---

## Phase 4: User Story 2 - ID Token Scope Consistency (Priority: P2)

**Goal**: Ensure ID Token claims match the authorized scopes.

**Independent Test**: Inspect the ID Token generated during token exchange and verify it contains claims corresponding to the authorized scopes.

### Tests for User Story 2

- [ ] T015 [US2] Add test case to `apps/backend/tests/integration/token-exchange.test.ts` to verify ID Token claims for specific scopes (e.g., `uinfin`)

### Implementation for User Story 2

- [ ] T016 [US2] Verify `TokenService.generateTokens` and `generateIdToken` correctly pass and use the `scope` parameter in `apps/backend/src/core/application/services/token.service.ts`

**Checkpoint**: User Story 2 functional - ID Tokens are now consistent with authorized scopes.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and cleanup

- [ ] T017 [P] Run all integration tests to ensure no regressions: `bun test apps/backend/tests/integration/`
- [ ] T018 [P] Verify code coverage for modified files is >= 80%
- [ ] T019 [P] Run `quickstart.md` validation steps
- [ ] T020 Final database schema sync check: `bunx drizzle-kit push:sqlite`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Can start immediately.
- **Foundational (Phase 2)**: Depends on reproduction test confirmation in Phase 1.
- **User Stories (Phase 3+)**: Depend on Foundational (Phase 2) completion.
- **Polish (Final Phase)**: Depends on all user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Core propagation fix.
- **User Story 2 (P2)**: Extends consistency to ID Tokens (depends on US1 foundation).

### Parallel Opportunities

- T004, T008, T009 can be implemented in parallel once the schema (T005) is finalized.
- T010 and T011 can be prepared in parallel.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Confirm bug with reproduction test.
2. Apply foundational changes to DB and Use Cases.
3. Verify US1 with integration tests.

### Incremental Delivery

1. Fix scope storage in Auth Code and Access Token (US1).
2. Fix ID Token claim mapping (US2).
3. Final cleanup and schema consolidation.
