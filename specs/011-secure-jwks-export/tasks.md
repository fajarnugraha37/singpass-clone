# Tasks: Secure JWKS Public Key Export

**Input**: Design documents from `specs/011-secure-jwks-export/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Unit tests are explicitly requested in the feature specification (Acceptance Criterion 3).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Monorepo Structure**: `apps/backend/src/`, `apps/backend/tests/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Verify branch `011-secure-jwks-export` is active and synced
- [x] T002 [P] Verify backend environment (Bun 1.1+, Hono, `jose` installed) in `apps/backend/package.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

*Note: For this surgical security fix, the foundation is already in place. We proceed directly to User Story 1.*

- [x] T003 [P] Identify the exact location of `getPublicJWKS()` in `apps/backend/src/infra/adapters/jose_crypto.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - Secure Public Key Retrieval (Priority: P1) 🎯 MVP

**Goal**: Retrieve public keys from the `/.well-known/keys` endpoint without any private components.

**Independent Test**: Run the unit test created in T004 and verify it passes with the `d` parameter absent.

### Tests for User Story 1 (REQUIRED) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T004 [US1] Create unit test in `apps/backend/tests/infra/adapters/jose_crypto_jwks.test.ts` to assert that `d` is absent from the exported JWKS

### Implementation for User Story 1

- [x] T005 [US1] Implement secure stripping logic in `getPublicJWKS()` within `apps/backend/src/infra/adapters/jose_crypto.ts`
- [x] T006 [US1] Verify the fix by running the unit test from T004
- [x] T007 [US1] Perform manual verification of the `/.well-known/keys` endpoint using `curl` as described in `specs/011-secure-jwks-export/quickstart.md`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T008 [P] Run `bun lint` and `bun format` in `apps/backend/`
- [x] T009 [P] Final documentation review and update of `specs/011-secure-jwks-export/quickstart.md` if paths changed
- [x] T010 [P] Ensure test coverage for `JoseCryptoService` remains >= 80%

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion
- **User Story 1 (Phase 3)**: Depends on Foundational completion
- **Polish (Final Phase)**: Depends on User Story 1 being complete

### User Story Dependencies

- **User Story 1 (P1)**: Independent of other future stories.

### Within Each User Story

- Test (T004) MUST be written and FAIL before implementation (T005)
- Implementation (T005) before Verification (T006, T007)

### Parallel Opportunities

- T002 and T003 can be done in parallel.
- Polish tasks T008, T009, T010 can be done in parallel once implementation is verified.

---

## Parallel Example: User Story 1

```bash
# Verify environment and identify code location simultaneously:
Task: "Verify backend environment"
Task: "Identify the exact location of getPublicJWKS()"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 & 2.
2. Complete Phase 3 (User Story 1).
3. **STOP and VALIDATE**: Verify the fix with the unit test and manual endpoint check.

### Incremental Delivery

1. Deliver the security fix as a single, verified PR once US1 is complete.

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Verify tests fail before implementing
- Commit after each task or logical group
