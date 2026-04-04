---
description: "Task list for feature implementation"
---

# Tasks: Vibe-Auth Developer & Admin Console

**Input**: Design documents from `/specs/042-add-management-console/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are mandatory per the Vibe-Auth Constitution. Unit tests MUST exist for all logic.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and base definitions

- [ ] T001 Define Management API Schemas in `packages/shared/src/contracts/mgmt.ts`
- [ ] T002 [P] Create Drizzle ORM schema extensions for management console in `apps/backend/src/adapters/database/schema.ts`
- [ ] T003 Generate and apply database migrations via `bun run check_migrations.ts`
- [ ] T004 [P] Update environment seeding script to include default Admin, Developer, and 10 Sandbox users in `apps/backend/src/scripts/seed.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 [P] Implement Mock Email Adapter (with SMTP support and `email_log` writing) in `apps/backend/src/adapters/email/mock.ts`
- [ ] T006 [P] Implement RBAC Auth Middleware (`developer` and `admin` scopes) in `apps/backend/src/adapters/http/middleware/rbac.ts`
- [ ] T007 Setup base Hono router for Management API in `apps/backend/src/adapters/http/mgmt.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - Developer Self-Service Registration & Client Management (Priority: P1) 🎯 MVP

**Goal**: A Developer can register for an account, log in, and manage OIDC clients (create, update, activate, deactivate) independently.

**Independent Test**: Can be fully tested by registering a new developer account via OTP, logging in, creating a client with specific scopes and JWKS, and verifying those settings persist.

### Tests for User Story 1 ⚠️

- [ ] T008 [P] [US1] Write unit tests for IAM core logic (OTP generation/verification) in `apps/backend/tests/core/iam.test.ts`
- [ ] T009 [P] [US1] Write unit tests for Client Management core logic (CRUD, secret rotation, soft-delete cascade) in `apps/backend/tests/core/clients.test.ts`

### Implementation for User Story 1

- [ ] T010 [P] [US1] Implement IAM Core Domain in `apps/backend/src/core/iam/service.ts`
- [ ] T011 [P] [US1] Implement Client Management Core Domain in `apps/backend/src/core/clients/service.ts`
- [ ] T012 [US1] Implement Auth RPC endpoints in `apps/backend/src/adapters/http/routes/auth.ts`
- [ ] T013 [US1] Implement Developer Client RPC endpoints in `apps/backend/src/adapters/http/routes/developer.ts`
- [ ] T014 [P] [US1] Create Developer Dashboard layout and pages in `apps/frontend/src/pages/developer/`
- [ ] T015 [P] [US1] Implement Svelte 5 Login component with OTP flow in `apps/frontend/src/components/developer/Login.svelte`
- [ ] T016 [US1] Implement Svelte 5 Client Management components (List, Create, Edit, Rotate) in `apps/frontend/src/components/developer/ClientManager.svelte`
- [ ] T017 [US1] Integrate Developer frontend components with Hono RPC client

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. MVP is achieved.

---

## Phase 4: User Story 2 - Admin Global Oversight & Revocation (Priority: P1)

**Goal**: An Administrator can view all developer accounts, OIDC clients, and active sessions, and revoke compromised access globally.

**Independent Test**: Can be tested by logging in as an Admin, viewing all registered entities via cursor-based pagination, and successfully revoking an active session.

### Tests for User Story 2 ⚠️

- [ ] T018 [P] [US2] Write unit tests for Session Management core logic in `apps/backend/tests/core/sessions.test.ts`
- [ ] T019 [P] [US2] Write unit tests for Admin God Mode queries (cursor pagination) in `apps/backend/tests/core/admin.test.ts`

### Implementation for User Story 2

- [ ] T020 [P] [US2] Implement Session Management Core Domain (Revocation) in `apps/backend/src/core/sessions/service.ts`
- [ ] T021 [P] [US2] Implement Admin Core Domain (Global list queries with cursor pagination) in `apps/backend/src/core/admin/service.ts`
- [ ] T022 [US2] Implement Admin RPC endpoints in `apps/backend/src/adapters/http/routes/admin.ts`
- [ ] T023 [P] [US2] Create Admin God Mode layout and pages in `apps/frontend/src/pages/admin/`
- [ ] T024 [P] [US2] Implement Svelte 5 Admin Global Lists components (Developers, Clients, Sessions) with cursor pagination in `apps/frontend/src/components/admin/GodMode.svelte`
- [ ] T025 [US2] Integrate Admin frontend components with Hono RPC client

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently.

---

## Phase 5: User Story 3 - Singpass Sandbox Data Generation (Priority: P2)

**Goal**: An Administrator can generate high-fidelity synthetic MyInfo attributes for Sandbox users to effectively test integration flows.

**Independent Test**: Can be tested by using the "Faker" utility in the UI to populate a Sandbox user's profile and verifying the generated NRIC, name, and address follow valid formats.

### Tests for User Story 3 ⚠️

- [ ] T026 [P] [US3] Write unit tests for Sandbox User core logic and Faker utility in `apps/backend/tests/core/sandbox.test.ts`

### Implementation for User Story 3

- [ ] T027 [P] [US3] Implement Sandbox Core Domain (CRUD, Faker generation via `@faker-js/faker`) in `apps/backend/src/core/sandbox/service.ts`
- [ ] T028 [US3] Implement Sandbox RPC endpoints in `apps/backend/src/adapters/http/routes/sandbox.ts`
- [ ] T029 [P] [US3] Implement Svelte 5 Sandbox User components (List, Create with Faker) in `apps/frontend/src/components/admin/SandboxManager.svelte`
- [ ] T030 [US3] Integrate Sandbox UI with Hono RPC client

**Checkpoint**: All user stories should now be independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T031 [P] Verify API stability and input validation for all endpoints (Hono + Zod)
- [ ] T032 Test full end-to-end flow from `quickstart.md`
- [ ] T033 Code cleanup and ensure DRY/KISS Hexagonal compliance
- [ ] T034 [P] Ensure UI adheres strictly to TailwindCSS styling rules for Admin/Developer portal differentiation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User Story 1 and User Story 2 can proceed in parallel once Phase 2 is completed.
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - No dependencies on other stories

### Within Each User Story

- Tests MUST be written and FAIL before implementation (per constitution).
- Hexagonal core domain (models/services) before RPC endpoints.
- RPC endpoints before Svelte components.
- Story complete before moving to next priority (unless staffed for parallel work).

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel.
- All tests for a user story marked [P] can run in parallel.
- Core domain logic within a story marked [P] can run in parallel.
- Frontend layout/component creation marked [P] can run in parallel with backend development.

---

## Parallel Example: User Story 1

```bash
# Launch backend and frontend development in parallel for User Story 1:
Task: "Implement IAM Core Domain in apps/backend/src/core/iam/service.ts"
Task: "Implement Client Management Core Domain in apps/backend/src/core/clients/service.ts"
Task: "Create Developer Dashboard layout and pages in apps/frontend/src/pages/developer/"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently (Developer self-service registration and client creation)
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → MVP!
3. Add User Story 2 → Test independently (Admin God Mode)
4. Add User Story 3 → Test independently (Singpass Faker Sandbox)
5. Each story adds value without breaking previous stories.