---
description: "Task list for UserInfo Endpoint implementation"
---

# Tasks: 009-userinfo-endpoint

**Input**: Design documents from `/specs/009-userinfo-endpoint/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Included as per project standards (coverage >= 80%) and spec.md "Independent Test" sections.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- File paths are relative to repository root.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure verification

- [ ] T001 Verify project structure for `apps/backend/src/core` and `apps/backend/src/infra`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure and utilities that MUST be complete before user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T002 Update `CryptoService` interface in `apps/backend/src/core/domain/crypto_service.ts` to include `signAndEncrypt`
- [ ] T003 [P] Implement `signAndEncrypt` (JWS-in-JWE) in `JoseCryptoService` in `apps/backend/src/infra/adapters/jose_crypto.ts`
- [ ] T004 [P] Create `UserInfoClaims` domain entity/mapping in `apps/backend/src/core/domain/userinfo_claims.ts`
- [ ] T005 [P] Implement `DPoPValidator` utility in `apps/backend/src/core/utils/dpop_validator.ts`
- [ ] T006 Configure `UserInfo` routes in `apps/backend/src/infra/http/authRouter.ts` (stub registration)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Successful Identity Retrieval (Priority: P1) 🎯 MVP

**Goal**: Implement the core `/userinfo` endpoint that returns a signed and encrypted identity payload.

**Independent Test**: Send a valid DPoP-bound access token and proof to `/userinfo` and verify a 200 OK response with a valid JWE body.

### Tests for User Story 1

- [ ] T007 [P] [US1] Unit test for nested JWE (JWS-in-JWE) generation in `apps/backend/tests/core/crypto.test.ts`
- [ ] T008 [P] [US1] Integration test for successful `GET /userinfo` in `apps/backend/tests/integration/userinfo.test.ts`

### Implementation for User Story 1

- [ ] T009 [P] [US1] Implement `UserInfoRepository` for data retrieval in `apps/backend/src/infra/adapters/db/drizzle_userinfo_repository.ts`
- [ ] T010 [US1] Implement `GetUserInfoUseCase` coordinating data retrieval and JWE encryption in `apps/backend/src/core/use-cases/get-userinfo.ts`
- [ ] T011 [US1] Implement `UserInfoController` handling GET/POST requests in `apps/backend/src/infra/http/controllers/userinfo.controller.ts`
- [ ] T012 [US1] Wire up `GET/POST /userinfo` in `apps/backend/src/infra/http/authRouter.ts`

**Checkpoint**: User Story 1 (MVP) is fully functional and testable independently.

---

## Phase 4: User Story 2 - Secure Token Validation (Priority: P2)

**Goal**: Enforce strict DPoP validation, including thumbprint (jkt) binding and `jti` uniqueness.

**Independent Test**: Attempt to access `/userinfo` with an invalid or unbound DPoP proof and verify a 401 rejection.

### Tests for User Story 2

- [ ] T013 [P] [US2] Integration test for DPoP binding failure in `apps/backend/tests/integration/userinfo_security.test.ts`

### Implementation for User Story 2

- [ ] T014 [US2] Enforce DPoP `jkt` binding check against the access token in `GetUserInfoUseCase`
- [ ] T015 [US2] Ensure `jti` replay protection is active in `DPoPValidator` using `used_jtis` table

---

## Phase 5: User Story 3 - Scoped Data Access (Priority: P3)

**Goal**: Filter the returned identity claims based on the scopes authorized for the access token.

**Independent Test**: Request UserInfo with limited scopes (e.g., `openid` only) and verify only authorized claims are included.

### Tests for User Story 3

- [ ] T016 [P] [US3] Unit test for scope-to-claims filtering logic in `apps/backend/tests/core/claims_filtering.test.ts`

### Implementation for User Story 3

- [ ] T017 [US3] Implement scope-based filtering in `GetUserInfoUseCase` using the `UserInfoClaims` logic

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements, documentation, and final validation

- [ ] T018 [P] Update Singpass server documentation in `docs/singpass-server/05-userinfo-endpoint.md`
- [ ] T019 Implement detailed audit logging for UserInfo operations (SC-003) in `GetUserInfoUseCase`
- [ ] T020 Run final validation using `specs/009-userinfo-endpoint/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Phase 1 - BLOCKS all user stories.
- **User Stories (Phase 3+)**: All depend on Phase 2 completion.
  - User Story 1 (P1) is the primary MVP target.
  - User Stories 2 and 3 can be worked on in parallel with or after US1.
- **Polish (Phase 6)**: Depends on all user stories being complete.

### Parallel Opportunities

- **Phase 2**: T003, T004, T005 can be implemented in parallel.
- **Phase 3**: T007, T008, T009 can be implemented in parallel.
- **Across Stories**: Once Phase 2 is done, US1, US2, and US3 implementation can proceed in parallel if resources allow.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 & 2 to establish the cryptographic and validation foundation.
2. Implement US1 to deliver the core functional increment (UserInfo retrieval).
3. Validate with integration tests and the `curl` examples in `quickstart.md`.

### Incremental Delivery

1. Foundation ready (Phase 2).
2. Core functionality (Phase 3).
3. Security hardening (Phase 4).
4. Privacy/Scope filtering (Phase 5).
5. Documentation and audit (Phase 6).

---

## Notes

- [P] tasks = different files, no dependencies.
- [Story] label maps tasks to specific user stories for traceability.
- Each user story is independently completable and testable.
- Ensure `jose` is used for all JWE, JWS, and DPoP operations.
- Latency MUST be minimized to meet SC-002 (< 150ms rejection).
