# Tasks: UserInfo `WWW-Authenticate` Headers

**Input**: Design documents from `/specs/019-userinfo-auth-headers/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests are requested in the plan.md and spec.md. TDD approach will be followed.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Confirm active branch is `019-userinfo-auth-headers` and environment is ready (Bun installed)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure and test setup that MUST be complete before ANY user story implementation

- [X] T002 [P] Prepare `apps/backend/tests/infra/userinfo_controller.test.ts` for new test cases (imports and mocks)
- [X] T003 [P] Add a base assertion utility or helper in `apps/backend/tests/infra/userinfo_controller.test.ts` to verify headers

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Request with Expired Token (Priority: P1) 🎯 MVP

**Goal**: Return correct `WWW-Authenticate` header when an access token is expired or invalid.

**Independent Test**: Send request with expired token and verify 401 response with `WWW-Authenticate: DPoP error="invalid_token", error_description="..."`.

### Tests for User Story 1

- [X] T004 [P] [US1] Add failing test case for expired token header in `apps/backend/tests/infra/userinfo_controller.test.ts`
- [X] T005 [P] [US1] Add failing test case for invalid token header in `apps/backend/tests/infra/userinfo_controller.test.ts`

### Implementation for User Story 1

- [X] T006 [US1] Implement `WWW-Authenticate` header for `invalid_token` errors in the catch block of `apps/backend/src/infra/http/controllers/userinfo.controller.ts`
- [X] T007 [US1] Verify T004 and T005 pass: `bun test apps/backend/tests/infra/userinfo_controller.test.ts`

**Checkpoint**: User Story 1 is fully functional and testable independently.

---

## Phase 4: User Story 2 - Request with Invalid DPoP Proof (Priority: P1)

**Goal**: Return correct `WWW-Authenticate` header when DPoP proof validation fails.

**Independent Test**: Send request with invalid DPoP proof and verify 401 response with `WWW-Authenticate: DPoP error="invalid_dpop_proof", error_description="..."`.

### Tests for User Story 2

- [X] T008 [P] [US2] Add failing test case for `invalid_dpop_proof` header in `apps/backend/tests/infra/userinfo_controller.test.ts`

### Implementation for User Story 2

- [X] T009 [US2] Implement `WWW-Authenticate` header for `invalid_dpop_proof` errors in the catch block of `apps/backend/src/infra/http/controllers/userinfo.controller.ts`
- [X] T010 [US2] Verify T008 passes: `bun test apps/backend/tests/infra/userinfo_controller.test.ts`

**Checkpoint**: User Stories 1 and 2 are functional.

---

## Phase 5: User Story 3 - Request without Authorization (Priority: P2)

**Goal**: Return correct `WWW-Authenticate` header when Authorization or DPoP headers are missing.

**Independent Test**: Send request without headers and verify 401 response with `WWW-Authenticate: DPoP error="invalid_request", error_description="..."`.

### Tests for User Story 3

- [X] T011 [P] [US3] Add failing test case for missing Authorization header in `apps/backend/tests/infra/userinfo_controller.test.ts`
- [X] T012 [P] [US3] Add failing test case for missing DPoP header in `apps/backend/tests/infra/userinfo_controller.test.ts`

### Implementation for User Story 3

- [X] T013 [US3] Update `WWW-Authenticate` header for missing `Authorization` (use `invalid_request`) in `apps/backend/src/infra/http/controllers/userinfo.controller.ts`
- [X] T014 [US3] Update `WWW-Authenticate` header for missing `DPoP` (add `error_description`) in `apps/backend/src/infra/http/controllers/userinfo.controller.ts`
- [X] T015 [US3] Verify T011 and T012 pass: `bun test apps/backend/tests/infra/userinfo_controller.test.ts`

**Checkpoint**: All user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and documentation

- [X] T016 Run all backend tests: `bun test apps/backend/tests/`
- [X] T017 [P] Manual verification using `curl` as specified in `specs/019-userinfo-auth-headers/quickstart.md`
- [X] T018 [P] Ensure no sensitive information is leaked in error descriptions

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Can start immediately.
- **Foundational (Phase 2)**: Depends on Setup.
- **User Stories (Phase 3-5)**: Depend on Foundational (Phase 2).
  - US1 and US2 are P1 and can be worked on in parallel.
  - US3 is P2 and should follow US1/US2.
- **Polish (Phase 6)**: Depends on all user stories completion.

### Parallel Opportunities

- T002 and T003 (Foundational test setup)
- T004, T005, T008, T011, T012 (All test cases can be added to the test file in parallel)
- US1 and US2 implementation can be done together as they both affect the same catch block.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 & 2.
2. Complete Phase 3 (User Story 1).
3. Validate and demo correct header for expired tokens.

### Incremental Delivery

1. Foundation ready.
2. Add US1 → Test independently.
3. Add US2 → Test independently.
4. Add US3 → Test independently.
5. Final verification and polish.
