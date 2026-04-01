# Tasks: Singpass QR Authentication Flow

**Input**: Design documents from `/specs/039-singpass-qr-auth/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are included per "Independent Test" sections in spec.md and "Testing Flow" in quickstart.md.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Define `QRSessions` schema in `packages/shared/src/schema.ts`
- [X] T002 Define RPC interface for QR auth in `packages/shared/src/rpc-types.ts`
- [X] T003 [P] Configure `qrcode` or equivalent library in `apps/frontend/package.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Generate and run migrations for `QRSessions` table in `apps/backend/`
- [X] T005 [P] Implement `SingpassNDIAdapter` for PAR and Token requests in `apps/backend/src/adapters/singpass-ndi.adapter.ts`
- [X] T006 [P] Create `QRAuthService` to manage session persistence in `apps/backend/src/services/qr-auth.service.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Successful Login via Singpass App (Priority: P1) 🎯 MVP

**Goal**: Enable users to log in by scanning a QR code with the Singpass App.

**Independent Test**: Scan the QR code with the Singpass App and verify automatic redirect to the dashboard.

### Tests for User Story 1

- [X] T007 [P] [US1] Create unit test for `SingpassNDIAdapter` in `apps/backend/tests/adapters/singpass-ndi.adapter.test.ts`
- [X] T008 [P] [US1] Create unit test for `QRAuthService` in `apps/backend/tests/services/qr-auth.service.test.ts`

### Implementation for User Story 1

- [X] T009 [US1] Implement `POST /auth/singpass/qr/init` in `apps/backend/src/controllers/singpass-qr.controller.ts`
- [X] T010 [US1] Implement `GET /auth/singpass/callback` to handle Singpass redirect in `apps/backend/src/controllers/singpass-qr.controller.ts`
- [X] T011 [US1] Implement `GET /auth/singpass/qr/status/:sessionId` (basic check) in `apps/backend/src/controllers/singpass-qr.controller.ts`
- [X] T012 [P] [US1] Implement `singpass-polling.ts` utility in `apps/frontend/src/lib/singpass-polling.ts`
- [X] T013 [US1] Create `QRAuth.svelte` with `$state` and basic render in `apps/frontend/src/components/QRAuth.svelte`
- [X] T014 [US1] Integrate `QRAuth.svelte` into the login page `apps/frontend/src/pages/login.astro` (replacing QRPlaceholder.svelte)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently.

---

## Phase 4: User Story 2 - Automated QR Expiration and Refresh (Priority: P2)

**Goal**: Automatically refresh the QR code when it expires (60s TTL).

**Independent Test**: Wait for 60 seconds on the login page and verify the QR code refreshes automatically.

### Tests for User Story 2

- [X] T015 [P] [US2] Add test case for QR expiration in `apps/backend/tests/controllers/singpass-qr.controller.test.ts`

### Implementation for User Story 2

- [X] T016 [US2] Implement expiration logic in `QRAuthService` (checking `expires_at`) in `apps/backend/src/services/qr-auth.service.ts`
- [X] T017 [US2] Update `QRAuth.svelte` to handle `EXPIRED` status and trigger re-initialization in `apps/frontend/src/components/QRAuth.svelte`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently.

---

## Phase 5: User Story 3 - Handling Login Cancellation (Priority: P3)

**Goal**: Detect and display cancellation when the user cancels on their phone.

**Independent Test**: Tap "Cancel" on the Singpass App and verify the website shows "Authorization cancelled".

### Implementation for User Story 3

- [X] T018 [US3] Handle Singpass cancellation error in `/callback` and update session status in `apps/backend/src/controllers/singpass-qr.controller.ts`
- [X] T019 [US3] Display "Authorization cancelled" UI in `QRAuth.svelte` in `apps/frontend/src/components/QRAuth.svelte`

**Checkpoint**: All user stories should now be independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T020 [P] Implement Long Polling wait logic (30s) in `apps/backend/src/controllers/singpass-qr.controller.ts`
- [X] T021 [P] Ensure DPoP headers are verified for all Singpass calls in `apps/backend/src/adapters/singpass-ndi.adapter.ts`
- [X] T022 [P] Add network retry logic to `singpass-polling.ts` in `apps/frontend/src/lib/singpass-polling.ts`
- [X] T023 Run final verification against `quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User Story 1 (P1) is the MVP and should be completed first.
  - User Stories 2 and 3 can be worked on sequentially or in parallel after US1.
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### Parallel Opportunities

- T003 (Frontend library config) can run in parallel with T001/T002.
- T005 and T006 (Backend adapter/service) can run in parallel.
- T007 and T008 (Unit tests) can run in parallel.
- T012 (Polling utility) can run in parallel with backend implementation (T009-T011).

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (MVP)
4. **STOP and VALIDATE**: Test User Story 1 independently using the Singpass Staging App.

### Incremental Delivery

1. Add User Story 2 (Expiration) to improve UX resilience.
2. Add User Story 3 (Cancellation) for complete user feedback loop.
3. Final Polish for production-readiness (Long Polling optimization, DPoP).
