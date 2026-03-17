---
description: "Actionable tasks for remediating Singpass compliance audit findings"
---

# Tasks: Singpass Compliance Audit Remediation

**Input**: Design documents from `/specs/032-singpass-compliance-fixes/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

## Phase 1: Setup

**Purpose**: Environment synchronization

- [x] T001 Sync dependencies and verify backend build environment via `npm install` in `apps/backend/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core schema and configuration updates required by all user stories

- [x] T002 Update `parRequestSchema` to include mandatory `purpose: z.string().min(1)` in `packages/shared/src/config.ts`
- [x] T003 Update `parRequests` table schema to include `purpose` column in `apps/backend/src/infra/database/schema.ts`
- [x] T004 Generate and run Drizzle migration for the `purpose` column in `apps/backend/drizzle/`
- [x] T005 Update `PersonInfoField` interface to include metadata fields (`source`, `classification`, `lastupdated`) in `apps/backend/src/core/domain/userinfo_claims.ts`
- [x] T006 Update `MyinfoPerson` domain model to include metadata fields in `apps/backend/src/core/domain/myinfo-person.ts`

**Checkpoint**: Foundation ready - schema and shared types are updated.

---

## Phase 3: User Story 1 - Privacy-Preserving Identity (Priority: P1) 🎯 MVP

**Goal**: Use stable UUID as `sub` claim instead of NRIC

**Independent Test**: Login and verify `sub` claim in ID token is a UUID.

### Implementation for User Story 1

- [x] T007 [P] [US1] Create unit test for UUID assignment logic in `apps/backend/tests/core/use-cases/ValidateLogin.test.ts`
- [x] T008 [US1] Update `ValidateLoginUseCase` to lookup user and assign database UUID to `session.userId` in `apps/backend/src/core/use-cases/ValidateLogin.ts`
- [x] T009 [US1] Verify `TokenService.generateIdToken` correctly uses `userId` from session for `sub` claim in `apps/backend/src/core/application/services/token.service.ts`

**Checkpoint**: User Story 1 MVP complete. Identity is now privacy-preserving.

---

## Phase 4: User Story 2 - Informed Consent (Priority: P1)

**Goal**: Capture and display the `purpose` of data access

**Independent Test**: PAR request fails without `purpose`; `purpose` is displayed on consent UI.

### Implementation for User Story 2

- [x] T010 [P] [US2] Create unit test for `purpose` validation in `apps/backend/tests/core/use-cases/register-par.test.ts`
- [x] T011 [US2] Update `RegisterParUseCase` to store the `purpose` parameter in the database in `apps/backend/src/core/use-cases/register-par.ts`
- [x] T012 [US2] Update backend `InitiateAuthSessionUseCase` to retrieve `purpose` from PAR if needed for redirection in `apps/backend/src/core/use-cases/InitiateAuthSession.ts`
- [x] T013 [US2] Update Consent UI to display the `purpose` string from the auth session in `apps/frontend/src/components/LoginForm.svelte` or a new component.

---

## Phase 5: User Story 3 - Secure API Communication (Priority: P2)

**Goal**: Prevent replay attacks using server-signed DPoP nonces

**Independent Test**: Verify endpoints reject requests with missing or invalid DPoP nonces.

### Implementation for User Story 3

- [x] T014 [P] [US3] Create integration test for DPoP nonce enforcement in `apps/backend/tests/integration/dpop_nonce.test.ts`
- [x] T015 [US3] Update `RegisterParUseCase` to validate the `nonce` in the DPoP proof in `apps/backend/src/core/use-cases/register-par.ts`
- [x] T016 [US3] Update `GetUserInfoUseCase` to validate the `nonce` in the DPoP proof in `apps/backend/src/core/use-cases/get-userinfo.ts`
- [x] T017 [US3] Update `ParController` to return `DPoP-Nonce` header on 400/401 errors in `apps/backend/src/infra/http/controllers/par.controller.ts`
- [x] T018 [US3] Update `TokenController` to return `DPoP-Nonce` header on 400/401 errors in `apps/backend/src/infra/http/controllers/token.controller.ts`

---

## Phase 6: User Story 4 - High-Fidelity MyInfo Attributes (Priority: P3)

**Goal**: Return MyInfo attributes with full Singpass-compliant metadata

**Independent Test**: Verify UserInfo response contains `source`, `classification`, and `lastupdated` fields.

### Implementation for User Story 4

- [x] T019 [P] [US4] Create unit test for attribute metadata mapping in `apps/backend/tests/unit/application/mappers/myinfo-mapper.test.ts`
- [x] T020 [US4] Update `mapMyinfoProfile` to include metadata fields for each attribute in `apps/backend/src/application/mappers/myinfo-mapper.ts`
- [x] T021 [US4] Update `mapUserInfoClaims` to include metadata for legacy fields in `apps/backend/src/core/domain/userinfo_claims.ts`
- [x] T022 [US4] Update `seed-myinfo.ts` to provide realistic metadata for mock users in `apps/backend/src/infra/database/seed-myinfo.ts`

---

## Phase 7: Polish & Cross-Cutting Concerns

- [x] T023 Run `quickstart.md` validation checklist
- [x] T024 Perform final codebase scan for hardcoded NRIC patterns using `grep`
- [x] T025 Verify test coverage for all modified use cases remains >= 80%

---

## Dependencies & Execution Order

1. **Foundational (T002-T006)** must be completed before any User Story work.
2. **US1 (T007-T009)** and **US2 (T010-T013)** can run in parallel.
3. **US3 (T014-T018)** depends on **US2** (PAR storage changes) but can start partially.
4. **US4 (T019-T022)** can run in parallel with other stories once Foundational is done.

### Parallel Opportunities

- **T007, T010, T014, T019**: All test creation tasks can run in parallel across stories.
- **T008 (US1), T011 (US2), T015 (US3), T020 (US4)**: Implementation tasks in different files can run in parallel.

---

## Implementation Strategy

### MVP First
1. Complete **Phase 2 (Foundation)**.
2. Complete **Phase 3 (US1)** to ensure PII is protected.
3. Validate US1 independently.

### Incremental Delivery
1. Add **US2 (Consent)** → Verify `purpose` persistence.
2. Add **US3 (DPoP Hardening)** → Verify replay protection.
3. Add **US4 (Metadata)** → Verify high-fidelity data mapping.
