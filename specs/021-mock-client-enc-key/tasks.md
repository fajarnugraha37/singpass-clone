# Tasks: Mock Client Registry — Add Encryption Key

**Input**: Design documents from `/specs/021-mock-client-enc-key/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are requested in the feature specification (Acceptance Scenarios).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Verify project environment and dependencies in `package.json` at repository root

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- [ ] T002 [P] Locate and inspect `MOCK_CLIENT_REGISTRY` in `apps/backend/src/infra/adapters/client_registry.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Successful Token Exchange for Mock Client (Priority: P1) 🎯 MVP

**Goal**: Update `mock-client-id` to support JWE ID Tokens by adding an encryption key to its registry entry.

**Independent Test**: Token exchange request for `mock-client-id` returns a 5-part JWE ID Token and no "encryption key not found" error.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T003 [P] [US1] Create integration test `apps/backend/tests/integration/token_exchange_encryption.test.ts` to verify JWE generation for `mock-client-id`

### Implementation for User Story 1

- [ ] T004 [US1] Update `mock-client-id` configuration in `apps/backend/src/infra/adapters/client_registry.ts` with the static `enc` key (ECDH-ES+A256KW) defined in `research.md`
- [ ] T005 [US1] Verify that `TokenService` in `apps/backend/src/core/application/services/token.service.ts` correctly resolves the new `enc` key
- [ ] T006 [US1] Run the integration test `apps/backend/tests/integration/token_exchange_encryption.test.ts` and ensure it passes

**Checkpoint**: User Story 1 is fully functional and testable independently.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T007 [P] Run all backend tests in `apps/backend/tests/` to ensure no regressions
- [ ] T008 [P] Document the new mock encryption key in `docs/singpass-server/04-token-endpoint.md` (if relevant)
- [ ] T009 Run `quickstart.md` validation in `specs/021-mock-client-enc-key/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup.
- **User Story 1 (Phase 3)**: Depends on Foundational (T002).
- **Polish (Final Phase)**: Depends on User Story 1 completion.

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies on other stories.

### Within Each User Story

- T003 (Test) MUST be written and FAIL before T004 (Implementation).
- T006 (Verification) depends on T003 and T004.

### Parallel Opportunities

- T003 and T004 can be prepared in parallel (different files).
- T007 and T008 can run in parallel after story completion.

---

## Parallel Example: User Story 1

```bash
# Prepare test and implementation in parallel:
Task: "Create integration test in apps/backend/tests/integration/token_exchange_encryption.test.ts"
Task: "Update mock-client-id configuration in apps/backend/src/infra/adapters/client_registry.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 & 2.
2. Implement User Story 1 (Phase 3).
3. **STOP and VALIDATE**: Verify JWE generation for `mock-client-id`.

---

## Notes

- [P] tasks = different files, no dependencies.
- [Story] label maps task to specific user story.
- Verify tests fail before implementing.
- Run `quickstart.md` as the final validation step.
