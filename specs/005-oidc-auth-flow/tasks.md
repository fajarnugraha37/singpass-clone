# Tasks: OIDC Authorization Endpoint and Login Flow

**Input**: Design documents from `/specs/005-oidc-auth-flow/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/hono-rpc.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create `Auth Session` entity and Drizzle migration in `apps/backend/src/core/domain/session.ts` and `apps/backend/src/infra/database/schema.ts`
- [X] T002 Create `Authorization Code` entity and Drizzle migration in `apps/backend/src/core/domain/authorizationCode.ts` and `apps/backend/src/infra/database/schema.ts`
- [X] T003 Generate and run Drizzle migrations for the new entities in `apps/backend`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- [X] T004 Setup Auth Session repository interface and SQLite implementation in `apps/backend/src/infra/adapters/db/drizzle_session_repository.ts`
- [X] T005 Setup Authorization Code repository interface and SQLite implementation in `apps/backend/src/infra/adapters/db/drizzle_authorization_code_repository.ts`
- [X] T006 [P] Add Hono RPC types for Auth routes in `packages/shared/src/contracts/auth.ts` (mapping to `contracts/hono-rpc.md`)
- [X] T007 [P] Create base backend router for `/auth` and `/api/auth` in `apps/backend/src/infra/http/authRouter.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Secure Authentication Initiation (Priority: P1) 🎯 MVP

**Goal**: As a relying party user, I want to initiate an OIDC authorization request so that I can log in securely to the application.

**Independent Test**: Can be independently tested by sending a valid `GET /auth` request with a valid `client_id` and `request_uri` and ensuring the system responds with a secure cookie session and a redirect to the frontend login page.

### Tests for User Story 1

- [X] T008 [P] [US1] Write unit tests for Session initiation logic in `apps/backend/tests/core/use-cases/InitiateAuthSession.test.ts`
- [X] T009 [P] [US1] Write integration tests for `GET /auth` endpoint in `apps/backend/tests/infra/http/auth.test.ts`

### Implementation for User Story 1

- [X] T010 [P] [US1] Implement `InitiateAuthSession` use case in `apps/backend/src/core/use-cases/InitiateAuthSession.ts` (validates `client_id`, `request_uri`, creates session)
- [X] T011 [US1] Implement `GET /auth` endpoint handler in `apps/backend/src/infra/http/authRouter.ts` using the use case and setting secure HTTP-only cookie
- [X] T012 [US1] Implement error redirect handling for invalid `request_uri` or `client_id` within `GET /auth` in `apps/backend/src/infra/http/authRouter.ts`
- [X] T013 [P] [US1] Create basic Astro login page UI component at `apps/frontend/src/pages/login.astro`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently (Backend `/auth` redirects to Astro `/login` or throws OIDC errors).

---

## Phase 4: User Story 2 - Primary Login and 2FA Verification (Priority: P1)

**Goal**: As an end user, I want to authenticate via password and then complete a 2FA flow (Simulated SMS OTP) so that my identity is strongly verified.

**Independent Test**: Can be tested by filling out the login form on the frontend, submitting it, progressing to the 2FA screen, and successfully submitting a simulated SMS OTP.

### Tests for User Story 2

- [ ] T014 [P] [US2] Write unit tests for Login and 2FA validation logic in `apps/backend/tests/core/use-cases/ValidateLogin.test.ts` and `apps/backend/tests/core/use-cases/Validate2FA.test.ts`
- [ ] T015 [P] [US2] Write integration tests for `POST /api/auth/login` and `POST /api/auth/2fa` endpoints in `apps/backend/tests/infra/http/auth.test.ts`

### Implementation for User Story 2

- [ ] T016 [P] [US2] Implement `ValidateLogin` use case in `apps/backend/src/core/use-cases/ValidateLogin.ts` (validates credentials, generates 6-digit OTP, updates session state)
- [ ] T017 [P] [US2] Implement `Validate2FA` use case in `apps/backend/src/core/use-cases/Validate2FA.ts` (validates OTP against session state)
- [ ] T018 [US2] Implement `POST /api/auth/login` RPC endpoint in `apps/backend/src/infra/http/authRouter.ts`
- [ ] T019 [US2] Implement `POST /api/auth/2fa` RPC endpoint in `apps/backend/src/infra/http/authRouter.ts`
- [ ] T020 [P] [US2] Create Svelte interactive Login form component `apps/frontend/src/components/LoginForm.svelte` linking to Hono RPC
- [ ] T021 [P] [US2] Create Svelte interactive 2FA form component `apps/frontend/src/components/TwoFactorForm.svelte` linking to Hono RPC
- [ ] T022 [US2] Integrate `LoginForm.svelte` and `TwoFactorForm.svelte` into `apps/frontend/src/pages/login.astro` with client-side state transitions

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. The user can submit primary credentials and simulated 2FA OTPs from the Astro frontend to the Hono backend.

---

## Phase 5: User Story 3 - Authorization Code Generation and Redirect (Priority: P1)

**Goal**: As an authenticated user, I want to be redirected back to the relying party application with an authorization code so that the application can finalize the login process.

**Independent Test**: Can be tested by completing the 2FA flow and verifying that the final redirect contains a valid `code` and the correct `state` parameter.

### Tests for User Story 3

- [ ] T023 [P] [US3] Write unit tests for Authorization Code generation in `apps/backend/tests/core/use-cases/GenerateAuthCode.test.ts`
- [ ] T024 [P] [US3] Write integration tests ensuring `POST /api/auth/2fa` returns the correct final redirect URI with `code` and `state`.

### Implementation for User Story 3

- [ ] T025 [P] [US3] Implement `GenerateAuthCode` use case in `apps/backend/src/core/use-cases/GenerateAuthCode.ts` (creates short-lived code tied to PKCE/DPoP)
- [ ] T026 [US3] Integrate `GenerateAuthCode` into the `Validate2FA` use case or `POST /api/auth/2fa` handler in `apps/backend/src/infra/http/authRouter.ts` to return the redirect URI upon successful 2FA.
- [ ] T027 [US3] Update frontend `TwoFactorForm.svelte` to execute `window.location.href = redirect_uri` upon receiving a successful response from `POST /api/auth/2fa`.

**Checkpoint**: All user stories should now be independently functional. The full end-to-end OIDC auth flow is complete.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T028 [P] Add generic error page UI at `apps/frontend/src/pages/error.astro` for invalid `request_uri` / `client_id` redirects.
- [ ] T029 Add logging of the simulated 6-digit OTP to the backend console for local development testing.
- [ ] T030 Ensure strict OIDC error parameters (`error`, `error_description`, `state`) are correctly appended on session expiry or invalid requests in backend handlers.
- [ ] T031 Run quickstart.md validation to ensure end-to-end flow works locally.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - Proceed sequentially in priority order (US1 -> US2 -> US3) as they build the sequential login flow.
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2).
- **User Story 2 (P1)**: Depends on Session creation in US1.
- **User Story 3 (P1)**: Depends on successful 2FA in US2.

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Use cases (services) before endpoints
- Backend endpoints before Frontend Svelte components
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- Entities and Migrations in Setup Phase.
- Repository interfaces and RPC types in Foundational Phase.
- Unit Tests and Integration Tests for each US can be written in parallel.
- Frontend Svelte Components (Forms) can be built in parallel with Backend Use Cases (once RPC types exist).

---

## Parallel Example: User Story 2

```bash
# Backend dev implements the use case:
Task: T016 [P] [US2] Implement `ValidateLogin` use case in `apps/backend/src/core/use-cases/ValidateLogin.ts`

# Frontend dev builds the Svelte UI simultaneously (mocking the RPC for now):
Task: T020 [P] [US2] Create Svelte interactive Login form component `apps/frontend/src/components/LoginForm.svelte` linking to Hono RPC
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently (Ensure `/auth` redirects properly and creates a session cookie).
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational -> Foundation ready
2. Add User Story 1 -> Test independently -> Deploy/Demo (MVP!)
3. Add User Story 2 -> Test independently -> Deploy/Demo
4. Add User Story 3 -> Test independently -> Deploy/Demo
5. Each story adds value without breaking previous stories
