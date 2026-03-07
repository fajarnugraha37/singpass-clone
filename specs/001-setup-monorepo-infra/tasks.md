# Tasks: Setup Monorepo Infrastructure

**Input**: Design documents from `/specs/001-setup-monorepo-infra/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: This task list includes test setup tasks as requested in the feature specification (FR-009, SC-003).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Initialize root `package.json` with workspaces (`apps/*`, `packages/*`) in root
- [ ] T002 Create directory structure: `apps/frontend`, `apps/backend`, `packages/shared`, `packages/config` in root
- [ ] T003 Configure root `tsconfig.json` with base settings and workspace aliases in root
- [ ] T004 [P] Create base ESLint configuration in `packages/config/eslint-preset.js`
- [ ] T005 [P] Create base Prettier configuration in `packages/config/prettier-preset.js`
- [ ] T006 [P] Create base TSConfig in `packages/config/tsconfig-base.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T007 Initialize Hono project in `apps/backend/package.json` with dependencies (hono, drizzle-orm, @libsql/client)
- [ ] T008 Initialize Astro project in `apps/frontend/package.json` with dependencies (astro, svelte, tailwindcss)
- [ ] T009 Setup shared workspace in `packages/shared/package.json` for types and constants
- [ ] T010 [P] Configure Hono Hexagonal structure: `apps/backend/src/core/domain`, `apps/backend/src/core/application`, `apps/backend/src/infra/adapters`
- [ ] T011 [P] Setup Drizzle configuration and SQLite schema in `apps/backend/src/infra/adapters/db/schema.ts`
- [ ] T012 Configure Bun test runner and coverage reporting in root `package.json`

**Checkpoint**: Foundation ready - workspace members can now be developed and tested.

---

## Phase 3: User Story 1 - Developer Initializes Monorepo (Priority: P1) 🎯 MVP

**Goal**: Establish a working Bun monorepo where all apps/packages are correctly linked and installable.

**Independent Test**: Run `bun install` at root and verify `node_modules` contains symlinks for local workspaces.

### Implementation for User Story 1

- [ ] T013 [US1] Finalize workspace dependency linking in root `package.json`
- [ ] T014 [US1] Implement placeholder health check in `apps/backend/src/index.ts`
- [ ] T015 [US1] Implement minimal Astro welcome page in `apps/frontend/src/pages/index.astro`
- [ ] T016 [US1] Verify `bun install` succeeds and populates root `node_modules`

**Checkpoint**: User Story 1 is complete - the monorepo is functional and ready for development.

---

## Phase 4: User Story 2 - Automated Code Quality & Formatting (Priority: P2)

**Goal**: Ensure consistent code style across all workspaces using ESLint and Prettier.

**Independent Test**: Run `bun run lint` and `bun run format` from the root and verify all workspaces are checked.

### Implementation for User Story 2

- [ ] T017 [US2] Link shared ESLint preset to `apps/backend/.eslintrc.json`
- [ ] T018 [US2] Link shared ESLint preset to `apps/frontend/.eslintrc.json`
- [ ] T019 [US2] Create root `lint` and `format` scripts in root `package.json`
- [ ] T020 [US2] Verify `bun run lint` identifies (and `format` fixes) style issues in both `apps/`

**Checkpoint**: User Story 2 is complete - code quality gates are active.

---

## Phase 5: User Story 3 - Integrated Testing Framework (Priority: P1)

**Goal**: Configure `bun test` with coverage reporting to meet the >80% mandate.

**Independent Test**: Run `bun test --coverage` and verify it generates a report for all workspaces.

### Implementation for User Story 3

- [ ] T021 [US3] Create placeholder test for backend in `apps/backend/tests/health.test.ts`
- [ ] T022 [US3] Create placeholder test for frontend in `apps/frontend/tests/smoke.test.ts`
- [ ] T023 [US3] Configure test coverage thresholds in root `package.json` (or `bunfig.toml` if applicable)
- [ ] T024 [US3] Verify `bun test --coverage` reports >= 80% on the initial boilerplate

**Checkpoint**: User Story 3 is complete - the testing infrastructure is ready for TDD.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and shared environment setup.

- [ ] T025 [P] Implement Hono RPC AppType export in `apps/backend/src/index.ts`
- [ ] T026 [P] Setup typed `.env` configuration in `packages/shared/src/config.ts`
- [ ] T027 [P] Create initial `.env` examples in `apps/backend/.env.example` and `apps/frontend/.env.example`
- [ ] T028 Validate all steps in `quickstart.md` work as expected

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Core root config. Start immediately.
- **Foundational (Phase 2)**: Depends on Phase 1 structure. Sets up specific app dependencies.
- **User Stories (Phase 3+)**: Depend on Foundational (Phase 2).
  - US1 (P1) is the core MVP.
  - US2 (P2) and US3 (P1) can proceed in parallel once the structure is stable.
- **Polish (Final Phase)**: Final integration and verification.

### Parallel Opportunities

- T004, T005, T006 (Shared configs)
- T010, T011 (Hono internal structure)
- T025, T026, T027 (Final polish items)
- Phase 4 (US2) and Phase 5 (US3) can be worked on simultaneously once apps are initialized.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (Initializing the apps)
3. Complete Phase 3: User Story 1 (Verifying the monorepo links)
4. **STOP and VALIDATE**: Ensure `bun install` works and apps can start.

### Incremental Delivery

1. Setup + Foundational -> Project Skeleton Ready
2. Add US1 -> Monorepo Verified (MVP)
3. Add US2 -> Quality Gates Active
4. Add US3 -> Testing Infrastructure Ready
5. Polish -> Developer Environment Complete

---

## Notes

- [P] tasks = different workspaces or packages, no direct file conflicts.
- [Story] labels ensure traceability to `spec.md`.
- All tasks target specific file paths as defined in the `plan.md` structure.
