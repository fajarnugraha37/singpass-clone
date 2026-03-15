---
description: "Task list for feature implementation: 026-userinfo-scope-handling"
---

# Tasks: UserInfo Scope Handling

**Input**: Design documents from `/specs/026-userinfo-scope-handling/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: This project follows a TDD approach for domain logic mapping. Unit tests are required before implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify environment and shared configurations

- [x] T001 Verify project structure and environment per implementation plan
- [x] T002 [P] Ensure shared configuration includes required token lifespans in `packages/shared/src/config.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Update interfaces and models to support refined Singpass FAPI 2.0 standards

- [x] T003 Update `UserInfoClaims` interface to remove redundant `sub_attributes` in `apps/backend/src/core/domain/userinfo_claims.ts`
- [x] T004 Update `IDTokenClaims` interface to remove legacy `uinfin` field in `apps/backend/src/core/utils/crypto.ts`
- [x] T005 [P] Update `UserData` interface to ensure `mobileno` is present in `apps/backend/src/core/domain/userinfo_claims.ts`

**Checkpoint**: Interface definitions aligned with design artifacts.

---

## Phase 3: User Story 1 - Requesting Full User Profile (Priority: P1) 🎯 MVP

**Goal**: Ensure full profile data is correctly mapped to UserInfo and ID Token claims.

**Independent Test**: Run claims unit tests and verify decrypted JWT payloads.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T006 [P] [US1] Create unit tests for refined `sub_attributes` logic (user.identity mapping) in `apps/backend/tests/core/claims.test.ts`
- [x] T007 [P] [US1] Create unit tests for refined UserInfo mapping (person_info nesting) in `apps/backend/tests/core/claims_filtering.test.ts`

### Implementation for User Story 1

- [x] T008 [US1] Refine `buildSubAttributes` in `apps/backend/src/core/domain/claims.ts` to map `identity_number` only from `user.identity` scope
- [x] T009 [US1] Update `buildSubAttributes` in `apps/backend/src/core/domain/claims.ts` to return `identity_coi` and `account_type` even if NRIC is missing
- [x] T010 [US1] Refine `mapUserInfoClaims` in `apps/backend/src/core/domain/userinfo_claims.ts` to only return `person_info` and security claims
- [x] T011 [US1] Update `TokenService.generateIdToken` in `apps/backend/src/core/application/services/token.service.ts` to remove top-level `uinfin` claim
- [x] T012 [US1] Ensure `GetUserInfoUseCase` in `apps/backend/src/core/use-cases/get-userinfo.ts` correctly handles the updated `UserInfoClaims` structure

**Checkpoint**: User Story 1 fully functional and passing all profile mapping tests.

---

## Phase 4: User Story 2 - Minimal Privacy Disclosure (Priority: P2)

**Goal**: Ensure only authorized scopes result in claims and missing user data is omitted entirely.

**Independent Test**: Run filtering unit tests with minimal scopes.

### Tests for User Story 2

- [x] T013 [P] [US2] Add unit tests for scope filtering and attribute omission (null/empty handling) in `apps/backend/tests/core/claims_filtering.test.ts`

### Implementation for User Story 2

- [x] T014 [US2] Ensure `mapUserInfoClaims` correctly omits fields from `person_info` when scopes are absent in `apps/backend/src/core/domain/userinfo_claims.ts`
- [x] T015 [US2] Ensure `buildSubAttributes` correctly omits fields from `sub_attributes` when scopes are absent in `apps/backend/src/core/domain/claims.ts`
- [x] T016 [US2] Implement logic to ensure `person_info` is present but empty `{}` when no identity scopes are granted

**Checkpoint**: User Story 2 verified - data exposure is strictly limited to authorized scopes.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and documentation

- [x] T017 [P] Run all backend unit tests using `bun test`
- [x] T018 [P] Perform manual verification using scenarios in `quickstart.md`
- [x] T019 Final code cleanup and documentation review

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Can start immediately.
- **Foundational (Phase 2)**: Depends on Phase 1 completion.
- **User Stories (Phase 3+)**: Depend on Foundational phase completion.
- **Polish (Final Phase)**: Depends on all user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Foundation ready.
- **User Story 2 (P2)**: Foundation ready. Independent of US1 but recommended to follow sequentially.

### Parallel Opportunities

- T004, T005 can run in parallel within Phase 2.
- T006, T007 (Tests) can run in parallel within Phase 3.
- T017, T018 can run in parallel within Final Phase.

---

## Parallel Example: User Story 1 Logic Verification

```bash
# Writing tests for both logic areas in parallel:
Task: "Create unit tests for refined sub_attributes logic in apps/backend/tests/core/claims.test.ts"
Task: "Create unit tests for refined UserInfo mapping in apps/backend/tests/core/claims_filtering.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Foundational phase (T003-T005).
2. Complete User Story 1 implementation (T006-T012).
3. **STOP and VALIDATE**: Verify that a full profile request returns all 4 fields in `person_info` and the complete `sub_attributes` block.

### Incremental Delivery

1. Foundation ready.
2. Deliver US1 (Full Profile) -> Test.
3. Deliver US2 (Privacy/Omission) -> Test.
4. Each story adds refined logic without breaking existing functionality.
