# Tasks: PAR authentication_context_type Validation

**Input**: Design documents from `/specs/012-par-auth-context-validation/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/auth.md, quickstart.md

**Tests**: Unit tests are required for all logic as per project mandates in `plan.md`.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Register feature branch `012-par-auth-context-validation` and verify environment
- [X] T002 [P] Update `packages/shared/src/config.ts` to include `AuthenticationContextType` enum and valid values constant
- [X] T003 [P] Update `ClientConfig` interface in `apps/backend/src/core/domain/client_registry.ts` to include `appType: 'Login' | 'Myinfo'`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 [P] Update `parRequestSchema` in `packages/shared/src/config.ts` to include optional `authentication_context_type` and `authentication_context_message`
- [X] T005 Update `MOCK_CLIENT_REGISTRY` in `apps/backend/src/infra/adapters/client_registry.ts` to assign `appType` to mock clients

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Secure Login App Transaction (Priority: P1) 🎯 MVP

**Goal**: Enforce mandatory `authentication_context_type` for Login apps to ensure Singpass compliance.

**Independent Test**: A "Login" type client sending a PAR request without `authentication_context_type` must receive an `invalid_request` error.

### Tests for User Story 1

- [ ] T006 [P] [US1] Create unit tests for mandatory context type for Login apps in `apps/backend/tests/unit/use-cases/register-par-context.test.ts`
- [ ] T007 [P] [US1] Create unit tests for valid/invalid enum values of `authentication_context_type` in `apps/backend/tests/unit/use-cases/register-par-context.test.ts`

### Implementation for User Story 1

- [ ] T008 [US1] Implement conditional validation for Login app mandatory context type in `apps/backend/src/core/use-cases/register-par.ts`
- [ ] T009 [US1] Implement enum validation for `authentication_context_type` in `apps/backend/src/core/use-cases/register-par.ts`
- [ ] T010 [US1] Verify `authentication_context_type` is correctly stored in the PAR payload in `apps/backend/src/core/use-cases/register-par.ts`

**Checkpoint**: User Story 1 is functional. Login apps are secure and compliant.

---

## Phase 4: User Story 2 - Transaction Context Message (Priority: P2)

**Goal**: Support validated custom messages for Login apps during authentication.

**Independent Test**: A "Login" type client sending a PAR request with a message exceeding 100 characters or containing invalid characters must be rejected.

### Tests for User Story 2

- [ ] T011 [P] [US2] Add unit tests for `authentication_context_message` validation (length and character set) in `apps/backend/tests/unit/use-cases/register-par-context.test.ts`

### Implementation for User Story 2

- [ ] T012 [US2] Update `parRequestSchema` in `packages/shared/src/config.ts` with length (100) and character set (`A-Za-z0-9 .,-@'!()`) validation
- [ ] T013 [US2] Verify `authentication_context_message` is stored in the PAR payload in `apps/backend/src/core/use-cases/register-par.ts`

**Checkpoint**: User Story 2 is functional. Custom context messages are supported and validated.

---

## Phase 5: User Story 3 - Myinfo App Compatibility (Priority: P3)

**Goal**: Ensure Myinfo apps remain compatible and cannot send authentication context parameters.

**Independent Test**: A "Myinfo" type client sending a PAR request with `authentication_context_type` must receive an `invalid_request` error.

### Tests for User Story 3

- [ ] T014 [P] [US3] Add unit tests for Myinfo app context restriction in `apps/backend/tests/unit/use-cases/register-par-context.test.ts`
- [ ] T015 [P] [US3] Add unit tests verifying Myinfo apps still work without context parameters in `apps/backend/tests/unit/use-cases/register-par-context.test.ts`

### Implementation for User Story 3

- [ ] T016 [US3] Implement restriction logic in `apps/backend/src/core/use-cases/register-par.ts` to reject context fields if client is 'Myinfo'

**Checkpoint**: User Story 3 is functional. Myinfo apps are isolated from Login-specific parameters.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and documentation

- [ ] T017 [P] Ensure error descriptions in `apps/backend/src/core/use-cases/register-par.ts` match `specs/012-par-auth-context-validation/contracts/auth.md`
- [ ] T018 Run all backend tests in `apps/backend` with `bun test` to ensure coverage and no regressions
- [ ] T019 [P] Perform manual validation using `curl` as described in `specs/012-par-auth-context-validation/quickstart.md`
- [ ] T020 [P] Update `FINDINGS.md` if any deviations were found during implementation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Phase 1 completion.
- **User Stories (Phases 3-5)**: Depend on Phase 2. Can be worked on in parallel once T006, T011, and T014 tests are written.
- **Polish (Phase 6)**: Depends on all User Stories being complete.

### User Story Dependencies

- **US1, US2, US3**: All are independent once the Foundation is ready.

### Parallel Opportunities

- T002 and T003 can be done in parallel.
- All unit test creation tasks (T006, T007, T011, T014, T015) can be done in parallel.
- T017-T020 can be done in parallel.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Setup and Foundational phases.
2. Implement User Story 1 (Mandatory context type for Login apps).
3. Validate US1 independently before proceeding to US2/US3.

### Incremental Delivery

1. Foundation ready.
2. US1 Delivered (Login app compliance).
3. US2 Delivered (Context messages support).
4. US3 Delivered (Myinfo app protection).
5. Polish and final verification.
