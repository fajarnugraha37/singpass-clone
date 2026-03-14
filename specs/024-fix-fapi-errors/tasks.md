# Tasks: Fix FAPI Error Types

**Feature**: Fix FAPI Error Types
**Branch**: `024-fix-fapi-errors`
**Spec**: [spec.md](./spec.md)
**Plan**: [plan.md](./plan.md)

## Summary

This document outlines the tasks required to align FAPI error handling with the Singpass specification by adding missing error types (`server_error`, `temporarily_unavailable`, `invalid_token`) to the `tokenErrorResponseSchema` and updating the `FapiErrors` helper and related token endpoint logic.

## Phases

### Phase 1: Setup

- [X] T001 Ensure `apps/backend/src/features/fapi-token/schemas/token-error-response-schema.ts` is correctly defined with required error codes.
- [X] T002 Ensure `apps/backend/src/infra/middleware/fapi-error.ts` includes factory methods for `server_error`, `temporarily_unavailable`, `invalid_token`.

### Phase 2: Foundational

*No specific foundational tasks identified for this feature.*

### Phase 3: User Story 1 (P1) - API Client Receives Specification-Compliant Errors

**Story Goal**: Align FAPI error handling with Singpass spec.
**Independent Test**: Trigger errors, verify schema.

- [X] T003 [US1] Update `apps/backend/src/core/application/services/token.service.ts` to throw appropriate FapiErrors (e.g., `invalidToken`, `serverError`, `temporarilyUnavailable`) based on error conditions.
- [X] T004 [US1] Update `apps/backend/src/infra/http/controllers/token.controller.ts` to throw appropriate FapiErrors (e.g., `invalidToken`, `serverError`, `temporarilyUnavailable`) based on error conditions.
- [X] T005 [US1] Add unit tests in `apps/backend/tests/features/fapi-token/lib/fapi-errors.test.ts` to cover the new `FapiErrors` factory methods (`invalidToken`, `serverError`, `temporarilyUnavailable`).
- [X] T006 [US1] Add integration tests in `apps/backend/tests/features/fapi-token/token-endpoint.test.ts` to verify that the token endpoint returns the correct error codes and status codes for invalid token, server errors, and temporary unavailability scenarios.

## Dependencies

- User Story 1 has no dependencies on other user stories.

## Parallel Execution Examples

- User Story 1: Tasks T003 and T004 could potentially be worked on in parallel if they affect different parts of the token flow, but T005 and T006 depend on T003 and T004 being implemented. Testing can often overlap with implementation.

## Implementation Strategy

MVP first (User Story 1), incremental delivery.

## Report

- Total tasks: 6
- Tasks per user story:
  - US1: 4 tasks (T003-T006)
- Parallel opportunities: T003 and T004 might offer some parallelization, but T005 and T006 are dependent on their completion.
- Independent test criteria per story:
  - US1: Trigger errors and verify schema compliance.
- Suggested MVP scope: User Story 1.
- Format validation: All tasks follow the checklist format.
