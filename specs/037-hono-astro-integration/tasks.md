# Tasks: Full-stack Hono-Astro Integration

**Input**: Design documents from `/specs/037-hono-astro-integration/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and monorepo configuration

- [X] T001 Configure Bun monorepo workspace for `apps/backend`, `apps/frontend`, and `packages/shared` in `package.json`
- [X] T002 Ensure `package.json` in `apps/backend` and `apps/frontend` have necessary dependencies (Astro, Hono, Svelte)
- [X] T003 [P] Update `tsconfig.json` in both apps to correctly reference `packages/shared` via path aliases

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure for type-safe RPC and session management

**⚠️ CRITICAL**: All tasks in this phase MUST be complete before starting user stories

- [X] T004 [P] Define `authSessionResponseSchema` in `packages/shared/src/contracts/auth.ts`
- [X] T005 Ensure `AppType` is exported from `apps/backend/src/index.ts` for frontend consumption
- [X] T006 Initialize Hono RPC client in `apps/frontend/src/lib/rpc.ts` using the exported `AppType`
- [X] T007 [P] Configure CORS middleware in `apps/backend/src/index.ts` to allow `credentials: true` and the frontend origin

**Checkpoint**: Foundation ready - type-safe communication channel is established

---

## Phase 3: User Story 1 - Dynamic Auth Flow (Priority: P1) 🎯 MVP

**Goal**: Fetch and display session info (Client Name) on component mount using Svelte islands

**Independent Test**: Mount `SessionInfo.svelte` on an Astro page; it should display "Hello, [Client Name]" after fetching data from the backend.

### Implementation for User Story 1

- [X] T008 [US1] Implement `authController.getSession` in `apps/backend/src/infra/http/controllers/auth.controller.ts` to return session and client metadata
- [X] T009 [US1] Register `/api/auth/session` GET route in `apps/backend/src/infra/http/authRouter.ts`
- [X] T010 [US1] Create `SessionInfo.svelte` in `apps/frontend/src/components/SessionInfo.svelte`
- [X] T011 [US1] Implement `onMount` RPC call to `/api/auth/session` within `SessionInfo.svelte` to hydrate state
- [X] T012 [US1] Add "Unauthorized" fallback state in `SessionInfo.svelte` to handle missing/expired sessions gracefully
- [X] T013 [US1] Integrate `SessionInfo.svelte` into `apps/frontend/src/layouts/BaseLayout.astro` or a specific page

**Checkpoint**: User Story 1 is functional; session data hydrates dynamically on static pages

---

## Phase 4: User Story 2 - Public Documentation Registry (Priority: P2)

**Goal**: Pre-render all markdown documentation at build time using Astro SSG

**Independent Test**: Run `astro build` and verify that `dist/docs/` contains static `.html` files for every markdown file in the root `docs/` directory.

### Implementation for User Story 2

- [X] T014 [US2] Create `apps/frontend/src/pages/docs/[...path].astro` for dynamic routing of documentation
- [X] T015 [US2] Implement `getStaticPaths` in `[...path].astro` to recursively find and map `.md` files from the monorepo root `docs/`
- [X] T016 [US2] Implement markdown rendering logic in `[...path].astro` using Astro's built-in `<Content />` component
- [X] T017 [US2] Create `DocLayout.astro` in `apps/frontend/src/layouts/DocLayout.astro` with proper sidebar/navigation for docs
- [X] T018 [US2] Ensure all static assets (images) referenced in docs are correctly resolved or copied during build

**Checkpoint**: Documentation is fully pre-rendered and accessible without runtime API calls

---

## Phase 5: User Story 3 - Type-Safe Communication (Priority: P3)

**Goal**: Enforce centralized contract management across the monorepo

**Independent Test**: Modify a field in a shared schema and confirm that both `backend` and `frontend` fail type-checking (`tsc --noEmit`).

### Implementation for User Story 3

- [X] T019 [US3] Centralize all existing auth-related Zod schemas from `apps/backend` into `packages/shared/src/contracts/auth.ts`
- [X] T020 [US3] Refactor `apps/backend/src/infra/http/authRouter.ts` to use schemas imported ONLY from `@vibe-auth/shared`
- [X] T021 [US3] Verify that the frontend RPC client in `apps/frontend/src/lib/rpc.ts` correctly reflects backend schema changes in real-time

**Checkpoint**: Monorepo-wide type safety is strictly enforced via shared contracts

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final hardening and verification

- [X] T022 Implement error boundary for Svelte RPC calls in `apps/frontend/src/components/ErrorBoundary.svelte`
- [X] T023 [P] Add unit tests for `getSession` logic in `apps/backend/tests/infra/http/controllers/auth.controller.test.ts`
- [X] T024 Perform final build check: `cd apps/frontend && bun run build` to ensure SSG and RPC types are valid
- [X] T025 [P] Update root `README.md` with instructions on how the full-stack integration works

---

## Dependencies & Execution Order

### Phase Dependencies

1. **Setup (Phase 1)** -> **Foundational (Phase 2)**: Core structure must exist before defining contracts.
2. **Foundational (Phase 2)** -> **User Stories (Phases 3-5)**: RPC and contracts block all feature implementation.
3. **User Stories (Phase 3-5)**: Can proceed in parallel once Phase 2 is complete, although US1 is the priority MVP.
4. **Polish (Phase 6)**: Final stage after all stories are implemented.

### Parallel Opportunities

- T003, T004, and T007 can be worked on simultaneously.
- T014-T018 (US2) can start in parallel with T008-T013 (US1) once the Foundation is ready.
- T023 and T025 can run in parallel during the polish phase.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

Focus on getting the dynamic session hydration working first. This proves the end-to-end RPC tunnel works with credentials and cookies.

### Incremental Delivery

1. **Foundation**: RPC client + Shared schemas.
2. **Dynamic**: `SessionInfo` component (US1).
3. **Static**: Documentation SSG (US2).
4. **Hardening**: Shared contract cleanup (US3) + Polish.

---

## Notes

- **CORS**: Pay special attention to T007; Hono must allow the Astro dev port (typically 4321) and `credentials: true`.
- **Recursion**: T015 requires a recursive glob (e.g., `import.meta.glob('../../../../docs/**/*.md')`) to handle nested documentation.
- **Type Safety**: Avoid using `any` in `rpc.ts` or controller responses to maintain SC-001.
