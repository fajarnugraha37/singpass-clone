# Tasks: Singpass Compliance Remediation

**Input**: Design documents from `/specs/033-singpass-compliance-remediation/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md

**Tests**: Tests are explicitly requested for each user story to verify compliance with Singpass v5 and FAPI 2.0 standards.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)

---

## Phase 1: Setup (Compliance Baseline)

**Purpose**: Establish a clean state for compliance verification.

- [x] T001 Verify project structure and environment per implementation plan
- [x] T002 Run baseline tests to ensure current auth flows are functional
- [x] T003 [P] Configure additional test reporters for compliance audit trails

---

## Phase 2: Foundational (Schema & Utilities)

**Purpose**: Core infrastructure updates identified in the audit.

- [x] T004 [P] Verify `purpose: z.string().min(1)` presence in `packages/shared/src/config.ts`
- [x] T005 Verify `purpose` column in `par_requests` and `auth_sessions` tables in `apps/backend/src/infra/database/schema.ts`
- [x] T006 [P] Verify `sub: user.id` mapping in `apps/backend/src/core/domain/userinfo_claims.ts`

---

## Phase 3: User Story 1 - Purpose Limitation (Priority: P1) 🎯 MVP

**Goal**: Ensure the `purpose` string is captured, validated, and displayed to the user for transparent consent.

**Independent Test**: Initiate PAR with `purpose`, verify it appears on the login screen, and verify PAR rejection if `purpose` is missing.

### Tests for User Story 1

- [x] T007 [P] [US1] Create unit test for `purpose` validation in `apps/backend/tests/unit/core/use-cases/register-par.test.ts`
- [x] T008 [US1] Create integration test verifying `purpose` display on consent UI in `apps/backend/tests/integration/consent-flow.test.ts`

### Implementation for User Story 1

- [x] T009 [US1] Ensure `RegisterParUseCase` rejects requests missing `purpose` in `apps/backend/src/core/use-cases/register-par.ts`
- [x] T010 [US1] Verify `InitiateAuthSessionUseCase` correctly maps `purpose` to the session in `apps/backend/src/core/use-cases/InitiateAuthSession.ts`
- [x] T011 [US1] Verify the frontend `login.astro` correctly fetches and displays `purpose` from the session API in `apps/frontend/src/pages/login.astro`

---

## Phase 4: User Story 2 - DPoP-Nonce Mechanism (Priority: P1)

**Goal**: Implement and verify the full DPoP-Nonce rotation and retry flow for protected endpoints.

**Independent Test**: Request token with invalid/missing nonce, verify 401 response with `DPoP-Nonce` header, and verify success on retry with that nonce.

### Tests for User Story 2

- [x] T012 [P] [US2] Create compliance test for nonce rotation in `apps/backend/tests/compliance/dpop-nonce.test.ts`
- [x] T013 [US2] Create integration test for nonce validation in `TokenExchangeUseCase` in `apps/backend/tests/integration/token-nonce.test.ts`

### Implementation for User Story 2

- [x] T014 [US2] Verify `DPoPValidator` correctly returns `use_dpop_nonce` error when `expectedNonce` mismatch in `apps/backend/src/core/utils/dpop_validator.ts`
- [x] T015 [US2] Ensure `TokenExchangeUseCase` returns a fresh `DPoP-Nonce` on failure and success in `apps/backend/src/core/use-cases/token-exchange.ts`
- [x] T016 [US2] Ensure `register-par.ts` returns a fresh `DPoP-Nonce` in the response headers in `apps/backend/src/core/use-cases/register-par.ts`

---

## Phase 5: User Story 3 - MyInfo Attribute Metadata (Priority: P2)

**Goal**: Fix broken seed data and ensure all MyInfo attributes include mandatory `source`, `classification`, and `lastupdated` metadata.

**Independent Test**: Call UserInfo endpoint and verify each attribute object contains all 4 required fields.

### Tests for User Story 3

- [x] T017 [P] [US3] Create unit test for metadata mapping in `apps/backend/tests/unit/application/mappers/myinfo-mapper.test.ts`
- [x] T018 [US3] Create integration test for UserInfo JSON structure in `apps/backend/tests/integration/userinfo-metadata.test.ts`

### Implementation for User Story 3

- [x] T019 [US3] Update `seed-myinfo.ts` to use `withMeta` helper and avoid overwriting metadata structures in `apps/backend/src/infra/database/seed-myinfo.ts`
- [x] T020 [US3] Verify `mapMyinfoProfile` preserves all metadata fields during flattening in `apps/backend/src/application/mappers/myinfo-mapper.ts`

---

## Phase 6: User Story 4 - NRIC to UUID Migration (Priority: P1)

**Goal**: Verify that the `sub` claim is a persistent UUID and that NRIC is never leaked as a primary identifier.

**Independent Test**: Inspect ID Token payload and verify `sub` is a valid UUID string.

### Tests for User Story 4

- [x] T021 [P] [US4] Create integration test verifying `sub` claim format in `apps/backend/tests/integration/id-token-sub.test.ts`

### Implementation for User Story 4

- [x] T022 [US4] Verify `ValidateLoginUseCase` sets `session.userId` to `user.id` (UUID) in `apps/backend/src/core/use-cases/ValidateLogin.ts`
- [x] T023 [US4] Verify `TokenService` maps `userId` to `sub` in `apps/backend/src/core/application/services/token.service.ts`

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and documentation updates.

- [x] T024 [P] Update `docs/singpass-server/` with remediated endpoint behavior
- [x] T025 Run all tests in `apps/backend/tests/compliance` to ensure zero regressions
- [x] T026 [P] Security hardening: Ensure `DPoP-Nonce` TTL is enforced (15m)
- [x] T027 Run `quickstart.md` validation steps


---

## Dependencies & Execution Order

### Phase Dependencies

1. **Setup (Phase 1)**: No dependencies.
2. **Foundational (Phase 2)**: Depends on Phase 1.
3. **User Stories (Phase 3-6)**: All depend on Phase 2.
   - US1, US2, US4 (P1) should be prioritized first.
   - US3 (P2) can be done in parallel with others.
4. **Polish (Phase 7)**: Depends on all stories being verified.

### Parallel Opportunities

- T004, T006 (Phase 2)
- T007, T012, T017, T021 (All P1 story tests)
- T024, T026 (Polish)

---

## Parallel Example: User Story 1 & 2 Tests

```bash
# Launch validation tests for US1 and US2 in parallel
bun test apps/backend/tests/unit/core/use-cases/register-par.test.ts
bun test apps/backend/tests/compliance/dpop-nonce.test.ts
```

---

## Implementation Strategy

### MVP First (Compliance Core)

1. Complete Setup and Foundational.
2. Implement and verify US4 (NRIC to UUID) as it's the most critical privacy finding.
3. Implement and verify US2 (DPoP-Nonce) as it's the highest security finding.
4. Implement US1 (Purpose) to satisfy transparency requirements.

### Incremental Delivery

1. **Privacy Milestone**: US4 complete and verified.
2. **Security Milestone**: US2 complete and verified.
3. **Transparency Milestone**: US1 complete and verified.
4. **Data Integrity Milestone**: US3 complete and verified.

---

## Notes

- All tasks include exact file paths.
- Each user story is independently testable via its own phase.
- Audit remediation requires both code changes and data corrections (seed data).
- The `032` feature partially addressed some of these, but this feature (033) ensures full end-to-end verification and fixes the remaining gaps (Metadata, full retry flows).
