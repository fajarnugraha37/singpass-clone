# Tasks: Unify Client Registry Access

**Input**: Design documents from `specs/022-unify-client-registry-access/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md

**Organization**: All tasks are part of a single, prioritized user story focused on refactoring for architectural consistency.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on other in-progress tasks)
- **[Story]**: All tasks belong to User Story 1 `[US1]`

## Path Conventions

- All paths are relative to the repository root.

---

## Phase 1: User Story 1 - Refactor to Unify Client Registry Access (🎯 MVP)

**Goal**: Refactor the codebase to ensure all client configuration is accessed exclusively through the `ClientRegistry` port, adhering to hexagonal architecture principles.

**Independent Test**: After this phase is complete, a global search for `getClientConfig` should yield no results in the application source code (it may still exist in tests and the function definition). All application logic should rely on the injected `ClientRegistry`.

### Implementation for User Story 1

- [X] T001 [P] [US1] Refactor `JoseCryptoService` to accept `ClientRegistry` via its constructor and use it in the `validateRedirectUri` method. Update file `apps/backend/src/infra/adapters/jose_crypto.ts`.
- [X] T002 [P] [US1] Refactor `TokenService` to accept `ClientRegistry` via its constructor and use it to fetch client configuration. Update file `apps/backend/src/core/application/services/token.service.ts`.
- [X] T003 [P] [US1] Refactor `ClientAuthService` to accept `ClientRegistry` via its constructor and use it to fetch client configuration. Update file `apps/backend/src/core/application/services/client-auth.service.ts`.
- [X] T004 [P] [US1] Refactor `userinfo.controller.ts` to remove the direct call to `getClientConfig`. The required client information should be provided by the corresponding use case. Update file `apps/backend/src/infra/http/controllers/userinfo.controller.ts`.
- [X] T005 [US1] Update the dependency injection wiring to pass the `clientRegistry` instance to the constructors of the refactored services (`JoseCryptoService`, `TokenService`, `ClientAuthService`). Update file `apps/backend/src/index.ts`.

**Checkpoint**: All application code now uses the `ClientRegistry` port. The old `getClientConfig` function is no longer called by the application.

---

## Phase 2: Update Tests

**Goal**: Ensure all tests pass after the refactoring and are updated to reflect the new dependency injection pattern.

- [X] T006 [US1] Update all affected unit and integration tests across the `apps/backend/tests/` directory. Mocks for the standalone `getClientConfig` function must be replaced with mocks for the `ClientRegistry` port interface.

**Checkpoint**: All tests are updated and passing. The codebase is functionally correct after the refactoring.

---

## Phase 3: Cleanup and Finalization

**Goal**: Remove the legacy code and perform final validation.

- [X] T007 [US1] Delete the deprecated `getClientConfig` function from the file `apps/backend/src/infra/adapters/client_registry.ts`.
- [X] T008 [US1] Run the entire test suite (`bun test`) to confirm that all tests pass after the function deletion.
- [X] T009 [US1] Perform a final, global search for the string `getClientConfig` to ensure no references remain anywhere in the codebase.

**Checkpoint**: The refactoring is complete and validated. The legacy code is removed.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Final documentation validation.

- [X] T010 [US1] Validate the instructions in `specs/022-unify-client-registry-access/quickstart.md` by manually checking them against the refactored codebase.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Refactoring)**: Can start immediately. Tasks T001-T004 can be done in parallel. T005 depends on T001, T002, and T003.
- **Phase 2 (Testing)**: Depends on Phase 1 completion.
- **Phase 3 (Cleanup)**: Depends on Phase 2 completion.
- **Phase 4 (Polish)**: Depends on Phase 3 completion.

### Parallel Opportunities

- **T001, T002, T003, T004**: These refactoring tasks are in separate files and can be performed in parallel.
- Test updates (**T006**) for each refactored service could potentially be parallelized if the test files are sufficiently isolated.

---

## Implementation Strategy

### MVP First (Complete Refactoring)

This feature is an atomic refactoring and should be completed in its entirety.

1.  Complete **Phase 1** to update all application logic.
2.  Complete **Phase 2** to update all tests.
3.  Complete **Phase 3** to remove the legacy code.
4.  Complete **Phase 4** for final validation.
5.  **STOP and VALIDATE**: The entire test suite passes, and the `getClientConfig` function is gone.

The MVP for this feature is the full completion of all tasks. There is no smaller, incremental value to be delivered.
