# Tasks: Unified HTTPS Architecture

**Input**: Design documents from `/specs/038-unified-https-arch/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- File paths are relative to the repository root.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Install `selfsigned` dependency in `apps/backend/package.json`
- [x] T002 [P] Create `.ssl/` directory in `apps/backend/.ssl/` and add to `.gitignore`
- [x] T003 [P] Configure `PORT_HTTPS` (443) and `PORT_HTTP` (80) in `.env.example` and root `.env`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure for TLS and multi-server support

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Implement `CertificateService` for automated TLS generation in `apps/backend/src/infrastructure/http/certificate.service.ts`
- [x] T005 [P] Create `ServerFactory` to encapsulate `Bun.serve` logic in `apps/backend/src/infrastructure/http/server.factory.ts`
- [x] T006 [P] Implement `HttpsServer` class with TLS support in `apps/backend/src/infrastructure/http/https.server.ts`
- [x] T007 [P] Implement `HttpRedirectServer` class for port 80 in `apps/backend/src/infrastructure/http/http.server.ts`

**Checkpoint**: Foundation ready - server components are defined and TLS logic is in place.

---

## Phase 3: User Story 3 - Automated Certificate Management (Priority: P2) 🎯 Early Win

**Goal**: Ensure certificates exist before the server starts.

**Independent Test**: Delete `.ssl/` content, start backend, verify files are recreated.

### Implementation for User Story 3

- [x] T008 [US3] Integrate `CertificateService` into backend startup sequence in `apps/backend/src/index.ts`
- [x] T009 [US3] Add filesystem check logic to verify certificate validity in `apps/backend/src/infrastructure/http/certificate.service.ts`

**Checkpoint**: User Story 3 is functional; certificates are managed automatically.

---

## Phase 4: User Story 1 - Secure Access (Priority: P1) 🎯 MVP

**Goal**: Serve the API and Frontend over HTTPS on port 443.

**Independent Test**: Navigate to `https://localhost:443` and verify the app loads.

### Implementation for User Story 1

- [x] T010 [US1] Configure main Hono app to serve static assets from `apps/frontend/dist` in `apps/backend/src/index.ts`
- [x] T011 [US1] Initialize `HttpsServer` on port 443 with TLS credentials in `apps/backend/src/index.ts`
- [x] T012 [P] [US1] Update `apps/frontend/astro.config.mjs` to set `site` and `base` for the new HTTPS origin
- [x] T013 [P] [US1] Update `apps/frontend/package.json` build script to output to `apps/backend/static` if needed, or update Hono to point to `apps/frontend/dist`

**Checkpoint**: User Story 1 is functional; the platform is accessible over HTTPS.

---

## Phase 5: User Story 2 - Automated HTTP to HTTPS Upgrade (Priority: P2)

**Goal**: Redirect all port 80 traffic to port 443.

**Independent Test**: Access `http://localhost:80` and verify redirect to `https://localhost:443`.

### Implementation for User Story 2

- [x] T014 [US2] Initialize `HttpRedirectServer` on port 80 in `apps/backend/src/index.ts`
- [x] T015 [US2] Implement global redirect middleware in `apps/backend/src/infrastructure/http/http.server.ts`

**Checkpoint**: User Story 2 is functional; HTTP is upgraded to HTTPS.

---

## Phase 6: User Story 4 - Unified Origin Experience (Priority: P3)

**Goal**: Cleanup and alignment for the unified origin.

**Independent Test**: Verify API calls from frontend use relative paths and succeed.

### Implementation for User Story 4

- [x] T016 [US4] Search and replace all hardcoded `3000` and `4321` references in `.env`, `README.md`, and config files
- [x] T017 [US4] Update `packages/shared/src/config.ts` to use the unified HTTPS origin
- [x] T018 [US4] Update `apps/backend/src/index.ts` CORS configuration to trust the unified origin

**Checkpoint**: All stories are complete and integrated.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Security hardening and final verification

- [x] T019 [P] Add HSTS and CSP headers to Hono middleware in `apps/backend/src/index.ts`
- [x] T020 [P] Implement proper MIME type detection for static assets in `apps/backend/src/index.ts`
- [x] T021 [P] Validate directory traversal protection in static file serving logic
- [x] T022 Update root `README.md` and `quickstart.md` with new port requirements
- [x] T023 Run final validation of all scenarios in `specs/038-unified-https-arch/spec.md`

---

## Dependencies & Execution Order

### Phase Dependencies

1. **Setup (Phase 1)**: Must complete first to have dependencies.
2. **Foundational (Phase 2)**: Depends on Phase 1. Blocks all server-related stories.
3. **User Story 3 (Phase 3)**: Should be done early to ensure TLS certs exist for US1.
4. **User Story 1 (Phase 4)**: The MVP - depends on Phase 2 and 3.
5. **User Story 2 & 4 (Phase 5 & 6)**: Can proceed after US1 is stable.
6. **Polish (Phase 7)**: Final step.

### Parallel Opportunities

- T002, T003 (Setup)
- T005, T006, T007 (Server components)
- T012, T013 (Frontend config)
- T019, T020, T021 (Security/MIME)

---

## Implementation Strategy

### MVP First (User Story 1)

1. Setup TLS generation (US3) and Hono HTTPS (US1).
2. Serve frontend static assets from the backend.
3. **VALIDATE**: HTTPS access to the app.

### Incremental Delivery

1. Add HTTP -> HTTPS redirect (US2).
2. Perform global port cleanup (US4).
3. Harden security headers (Polish).
