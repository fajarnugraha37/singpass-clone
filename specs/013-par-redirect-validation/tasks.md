# Tasks: PAR `redirect_uri` Registration Validation

**Branch**: `013-par-redirect-validation` | **Date**: 2026-03-15 | **Plan**: [specs/013-par-redirect-validation/plan.md]

## Implementation Strategy
- **MVP First**: Implement strict validation of `redirect_uri` against pre-registered client URIs in `RegisterParUseCase`.
- **Incremental Delivery**: Start with unit tests for the core logic, then implement the validation, and finally add integration tests to verify the end-to-end flow.

## Dependencies
- **Foundational**: All setup tasks and mock data must be ready.
- **US1**: Depends on foundational tasks.
- **Polish**: Depends on completion of US1.

## Phase 1: Setup
- [ ] T001 Verify current branch is `013-par-redirect-validation` and environment is ready.
- [ ] T002 Run existing tests in `apps/backend/tests/core/use-cases/register-par.test.ts` to ensure a stable baseline.

## Phase 2: Foundational
- [ ] T003 Verify `ClientConfig` model in `apps/backend/src/core/domain/client_registry.ts` and mock data in `apps/backend/src/infra/adapters/client_registry.ts` already support `redirectUris`.

## Phase 3: User Story 1 - Secure PAR Registration (Priority: P1)
**Goal**: Ensure `redirect_uri` in PAR is validated against pre-registered client URIs.
**Independent Test**: Run unit tests in `apps/backend/tests/core/use-cases/register-par.test.ts` focusing on redirection validation.

- [ ] T004 [P] [US1] Create unit tests in `apps/backend/tests/core/use-cases/register-par.test.ts` covering valid match, mismatch, case sensitivity, and empty registry.
- [ ] T005 [US1] Implement `redirect_uri` validation logic in `RegisterParUseCase.execute` in `apps/backend/src/core/use-cases/register-par.ts`.
- [ ] T006 [P] [US1] Create end-to-end integration tests in `apps/backend/tests/integration/par_validation.test.ts` to verify the `/par` endpoint returns `invalid_request` for unregistered redirect URIs.

## Final Phase: Polish & Cross-Cutting Concerns
- [ ] T007 Run all backend tests and verify 100% pass rate and coverage.
- [ ] T008 Perform manual verification using the steps in `specs/013-par-redirect-validation/quickstart.md`.

## Parallel Execution Examples
- T004 and T006 can be developed in parallel as they are both testing tasks, though they target different layers.
