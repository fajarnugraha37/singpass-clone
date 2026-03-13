---

description: "Task list for FAPI 2.0 Token Exchange Endpoint implementation"
---

# Tasks: 008-token-exchange

**Input**: Design documents from `/specs/008-token-exchange/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Included as per "Testing Check" in plan.md (coverage >= 80%).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- File paths are relative to repository root.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Verify `apps/backend` and `packages/shared` structure per plan.md
- [x] T002 Verify `jose` and `drizzle-orm` dependencies in `apps/backend/package.json`
- [x] T003 [P] Create shared types for token responses in `packages/shared/src/tokens.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Update database schema for `AccessToken`, `RefreshToken`, and `UsedJti` in `apps/backend/src/infra/db/schema.ts`
- [x] T005 [P] Implement DPoP validation utility using `jose` in `apps/backend/src/core/utils/dpop.ts`
- [x] T006 [P] Implement PKCE (S256) validation utility in `apps/backend/src/core/utils/pkce.ts`
- [x] T007 [P] Implement JWS/JWE utility for ID Token generation in `apps/backend/src/core/utils/crypto.ts`
- [x] T008 Configure FAPI 2.0 compliant error mapping and logging in `apps/backend/src/infra/middleware/fapi-error.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Client securely exchanges authorization code for tokens (Priority: P1) 🎯 MVP

**Goal**: Implement the `POST /token` endpoint supporting `authorization_code` grant with `private_key_jwt` and DPoP binding.

**Independent Test**: Simulate a valid POST request to `/token` with DPoP proof and client assertion, verifying that ID token (JWE), Access token, and Refresh token are returned.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T009 [P] [US1] Create unit tests for DPoP and PKCE validation in `apps/backend/tests/core/utils.test.ts`
- [x] T010 [P] [US1] Create integration test for `/token` endpoint in `apps/backend/tests/integration/token-exchange.test.ts`

### Implementation for User Story 1

- [ ] T011 [P] [US1] Implement `ClientAuthenticationService` for `private_key_jwt` validation in `apps/backend/src/core/services/client-auth.service.ts`
- [ ] T012 [P] [US1] Implement `TokenService` for generating DPoP-bound Access/Refresh tokens and JWE ID tokens in `apps/backend/src/core/services/token.service.ts`
- [ ] T013 [US1] Implement `TokenRepository` for database persistence and code invalidation in `apps/backend/src/infra/db/token.repository.ts`
- [ ] T014 [US1] Implement `TokenExchangeUseCase` coordinating validation and generation in `apps/backend/src/core/use-cases/token-exchange.use-case.ts`
- [ ] T015 [US1] Define Hono route and controller for `POST /token` in `apps/backend/src/index.ts`
- [ ] T016 [US1] Apply FAPI 2.0 error handling and input validation (Zod) to the token endpoint

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T017 [P] Update Singpass server documentation in `docs/singpass-server/04-token-endpoint.md`
- [ ] T018 Code cleanup and secret masking audit in `apps/backend/src/`
- [ ] T019 Performance check: Ensure token exchange is < 300ms (SC-002)
- [ ] T020 Run final validation using `specs/008-token-exchange/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Phase 1 - BLOCKS US1 implementation.
- **User Story 1 (Phase 3)**: Depends on Phase 2 completion.
- **Polish (Phase 4)**: Depends on US1 completion.

### User Story Dependencies

- **User Story 1 (P1)**: Independent of other future stories.

### Parallel Opportunities

- T003, T005, T006, T007 (Utilities and shared types)
- T009, T010 (Tests)
- T011, T012 (Core services)

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 & 2 to establish the secure foundation (DPoP/Crypto).
2. Implement US1 as the core functional increment.
3. Validate with integration tests and the provided `curl` example in `quickstart.md`.

### Incremental Delivery

1. Foundation ready (Phase 2).
2. Token exchange functional (Phase 3).
3. Documentation and polish (Phase 4).

---

## Notes

- [P] tasks = different files, no dependencies.
- [Story] label maps task to US1 for traceability.
- Each user story is independently completable and testable.
- Ensure `jose` is used for all cryptographic operations (JWE, JWS, DPoP).
- DB lookups must be optimized (< 200ms p95).
