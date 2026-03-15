# Tasks: Singpass Myinfo Userinfo Catalog Alignment

**Input**: Design documents from `/specs/027-userinfo-singpass-catalog/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `apps/backend/src/`, `apps/frontend/src/`
- **Shared packages**: `packages/shared/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure verification

- [x] T001 Verify project structure and Drizzle ORM configuration in `apps/backend/drizzle.config.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 [P] Create Myinfo Catalog TypeScript interfaces (Personal, Finance, Education, Family, Vehicle, Property, Government Scheme) in `packages/shared/src/types/myinfo-catalog.ts`
- [x] T003 [P] Create `MyinfoPerson` domain entity in `apps/backend/src/core/domain/myinfo-person.ts`
- [x] T004 Update Drizzle schema for user profiles to support Myinfo catalog data storage in `apps/backend/src/infra/database/schema.ts`


**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 2 - Provide Comprehensive Myinfo Data Catalog Fields (Priority: P1) 🎯 MVP

**Goal**: Support the full scope of Myinfo Data Catalogs, ensuring data fields are mapped correctly and explicitly return `null` for missing fields, seeded properly.

**Independent Test**: Can be tested independently by running the database seed script to ensure mock users are created with "test1234" password, and verifying data mapping logic handles the `{"value": ...}` format and explicit nulls.

### Tests for User Story 2 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T005 [P] [US2] Write unit tests for Myinfo data mapper to assert `{"value": ...}` wrapping and explicit nulls in `apps/backend/tests/unit/application/mappers/myinfo-mapper.test.ts`

### Implementation for User Story 2

- [x] T006 [P] [US2] Create Drizzle seed script for mock users with full catalog data and `test1234` password hash in `apps/backend/src/infra/database/seed-myinfo.ts`
- [x] T007 [US2] Implement user repository method to retrieve Myinfo profile by user ID in `apps/backend/src/infra/database/repositories/user-repository.ts`
- [x] T008 [US2] Implement `MyinfoMapper` to format fields with `{"value": "..."}` and handle explicit `null`s for missing data in `apps/backend/src/application/mappers/myinfo-mapper.ts`

**Checkpoint**: At this point, User Story 2 should be fully functional with populated mock database and proper data mappers.

---

## Phase 4: User Story 1 - Retrieve Validated Userinfo Payload (Priority: P1)

**Goal**: Implement the `/userinfo` endpoint matching Singpass Myinfo v5 specs (DPoP validation, properly signed JWS and encrypted JWE payload).

**Independent Test**: Can be tested independently by querying the `/userinfo` endpoint with a valid DPoP proof and access token to assert the response structure, headers, and cryptography match Singpass specs.

### Tests for User Story 1 ⚠️

- [x] T009 [P] [US1] Write unit tests for userinfo payload generation and cryptography in `apps/backend/tests/unit/application/usecases/generate-userinfo-payload.test.ts`
- [x] T010 [P] [US1] Write unit tests for Userinfo DPoP validation logic in `apps/backend/tests/unit/application/usecases/validate-userinfo-request.test.ts`

### Implementation for User Story 1

- [x] T011 [US1] Implement DPoP and Access Token validation logic for `/userinfo` in `apps/backend/src/application/usecases/validate-userinfo-request.ts`
- [x] T012 [US1] Implement JWS signing (ES256) and JWE encryption (ECDH-ES+A256KW/A256GCM) of `person_info` payload using `jose` in `apps/backend/src/application/usecases/generate-userinfo-payload.ts`
- [x] T013 [US1] Implement `GET /userinfo` Hono endpoint integrating validation, data retrieval, and encryption in `apps/backend/src/infra/http/routes/userinfo-routes.ts`
- [x] T014 [US1] Add standard OIDC error handling (e.g., `invalid_token`) returning 401 with `WWW-Authenticate` header in `apps/backend/src/infra/http/routes/userinfo-routes.ts`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work seamlessly end-to-end.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and ensuring compliance

- [x] T015 [P] Run Drizzle migrations (`bun run db:generate` and `bun run db:migrate`) from the backend app root
- [x] T016 Run unit test suite ensuring code coverage >= 80% for new logic
- [x] T017 Validate `/userinfo` end-to-end with the instructions in `specs/027-userinfo-singpass-catalog/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User Story 2 should be executed first since it handles data seeding and mapping needed by User Story 1.
  - User Story 1 builds on the mapped profile to deliver the HTTP endpoint.
- **Polish (Final Phase)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 2 (P1)**: Can start after Foundational (Phase 2).
- **User Story 1 (P1)**: Depends on User Story 2's data structures and mappers being available.

### Within Each User Story

- Tests MUST be written and FAIL before implementation.
- Core mappers and repositories before use cases and endpoint handlers.
- Story complete before moving to next priority.

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel.
- All Foundational tasks marked [P] can run in parallel.
- Unit tests within a user story marked [P] can be written in parallel.

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Write unit tests for userinfo payload generation and cryptography in apps/backend/tests/unit/application/usecases/generate-userinfo-payload.test.ts"
Task: "Write unit tests for Userinfo DPoP validation logic in apps/backend/tests/unit/application/usecases/validate-userinfo-request.test.ts"
```

---

## Implementation Strategy

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready.
2. Complete User Story 2 → Mock database fully populated, mappers format profile correctly.
3. Complete User Story 1 → Endpoint securely wraps the profile in JWS/JWE and serves it.
4. Each story adds value and ensures incremental stability.

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together.
2. Once Foundational is done:
   - Developer A: Starts on User Story 2 (Database seed scripts, Mappers)
   - Developer B: Starts on User Story 1 (DPoP validation logic, JWS/JWE Crypto utilities)
3. Both developers integrate at the Hono endpoint handler.