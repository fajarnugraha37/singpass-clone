# Tasks: OIDC Discovery and PAR Endpoint Implementation

**Input**: Design documents from `/specs/003-oidc-discovery-par/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/discovery-api.md

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Feature-specific domain setup

- [x] T001 Initialize domain interfaces for PAR in `apps/backend/src/core/domain/par.types.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema and core validation setup

- [x] T002 Define Drizzle schema for `PushedAuthorizationRequests` in `apps/backend/src/infra/data/schema.ts`
- [x] T003 [P] Define Drizzle schema for `ConsumedJti` in `apps/backend/src/infra/data/schema.ts`
- [x] T003b [P] Implement DPoP-Nonce generation and signature logic (stateless or minimal store)
- [x] T004 Run migrations to update SQLite database: `bunx drizzle-kit push`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - System Discovery Configuration (Priority: P1) 🎯 MVP

**Goal**: Expose standard-compliant Discovery and JWKS endpoints for client integration.

**Independent Test**: Verify `GET /.well-known/openid-configuration` and `GET /.well-known/keys` return expected JSON structures.

### Tests for User Story 1 (REQUIRED) ⚠️

- [x] T005 [P] [US1] Create unit tests for Discovery endpoint in `apps/backend/tests/infra/http/discovery.test.ts`
- [x] T006 [P] [US1] Create unit tests for JWKS endpoint in `apps/backend/tests/infra/http/jwks.test.ts`

### Implementation for User Story 1

- [x] T007 [US1] Implement Discovery endpoint handler in `apps/backend/src/infra/http/controllers/discovery.controller.ts`
- [x] T008 [US1] Implement JWKS endpoint handler in `apps/backend/src/infra/http/controllers/jwks.controller.ts`
- [x] T009 [US1] Register discovery and keys routes in `apps/backend/src/index.ts`

**Checkpoint**: Discovery and keys endpoints are functional and testable independently.

---

## Phase 4: User Story 2 - Secure Authorization Initiation (Priority: P1)

**Goal**: Securely pre-register authorization requests (PAR) with full FAPI 2.0 validation.

**Independent Test**: Successfully execute a PAR request with a valid signed assertion and receive a `request_uri`.

### Tests for User Story 2 (REQUIRED) ⚠️

- [x] T010 [P] [US2] Create unit tests for PAR use-case (validations, storage) in `apps/backend/tests/core/use-cases/register-par.test.ts`
- [x] T011 [P] [US2] Create unit tests for PAR endpoint (handler) in `apps/backend/tests/infra/http/par.test.ts`

### Implementation for User Story 2

- [x] T012 [P] [US2] Define Zod validation schema for PAR request in `apps/backend/src/infra/http/validators/par.validator.ts`
- [x] T013 [US2] Implement `RegisterParUseCase` in `apps/backend/src/core/use-cases/register-par.ts` (validate assertion, PKCE, DPoP, Singpass params)
- [x] T014 [US2] Implement `jti` replay protection logic in `apps/backend/src/core/use-cases/register-par.ts`
- [x] T015 [US2] Implement PAR endpoint handler in `apps/backend/src/infra/http/controllers/par.controller.ts`
- [x] T016 [US2] Integrate security audit logging for PAR failures in `apps/backend/src/core/use-cases/register-par.ts`
- [x] T017 [US2] Register PAR route in `apps/backend/src/index.ts`

**Checkpoint**: Secure PAR initiation is fully functional and integrated with SQLite.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and optimization

- [x] T018 Implement passive expiration filter for PAR/JTI lookups in `apps/backend/src/core/use-cases/register-par.ts`
- [x] T019 Run full test suite: `bun test --coverage --threshold 80` (enforce SC-005)
- [x] T020 [P] Validate all implementation against `quickstart.md` steps

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Phase 1 completion. BLOCKS US1/US2.
- **User Stories (Phase 3 & 4)**: Depend on Foundational completion.
  - US1 (Discovery) is simpler and can be completed first.
  - US2 (PAR) is the core security component.
- **Polish (Phase 5)**: Depends on all user stories completion.

### User Story Dependencies

- **US1**: Independent after Phase 2.
- **US2**: Independent after Phase 2.

### Within Each User Story

- Tests written first, then models, then services, then controllers.
- Commit after each task.

### Parallel Opportunities

- T003 (JTI schema) can run with T002 (PAR schema).
- T005 & T006 (US1 Tests) can run in parallel.
- T010 & T011 (US2 Tests) can run in parallel.
- T012 (Validator) can run with T013 (Use-case logic).

---

## Parallel Example: User Story 2

```bash
# Launch PAR tests together:
Task: "Create unit tests for PAR use-case in apps/backend/tests/core/use-cases/register-par.test.ts"
Task: "Create unit tests for PAR endpoint in apps/backend/tests/infra/http/par.test.ts"

# Launch implementation components together:
Task: "Define Zod validation schema for PAR request in apps/backend/src/infra/http/validators/par.validator.ts"
Task: "Implement RegisterParUseCase in apps/backend/src/core/use-cases/register-par.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 & 2 (Prerequisites).
2. Complete Phase 3 (Discovery Configuration).
3. **VALIDATE**: Ensure public endpoints work. This provides immediate value for client discovery.

### Incremental Delivery

1. Foundation ready.
2. Add Discovery (US1) -> Client-ready configuration.
3. Add PAR (US2) -> Secure session initiation.
4. Total FAPI 2.0 initiation layer complete.

---

## Notes

- All tasks follow `[ID] [P?] [Story] Description` format.
- `[P]` indicates files are distinct and have no implementation blockers.
- Coverage goal: SC-005 (>80%).
- All implementation logic follows Hexagonal Architecture in `apps/backend`.
