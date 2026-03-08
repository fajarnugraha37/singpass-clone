# Tasks: OIDC Discovery and PAR Endpoint Implementation

**Input**: Design documents from `/specs/003-oidc-discovery-par/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/discovery-api.md

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Feature-specific domain setup

- [X] T001 Initialize domain interfaces for PAR and JTI in `apps/backend/src/core/domain/par.types.ts`
- [X] T002 Initialize `par_requests` and `used_jtis` schema in `apps/backend/src/infra/database/schema.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema and core validation setup

- [X] T003 Run migrations to update SQLite database: `bunx drizzle-kit push`
- [X] T004 Implement DPoP key thumbprint (`jkt`) extraction logic in `apps/backend/src/core/domain/crypto_service.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - System Discovery Configuration (Priority: P1) 🎯 MVP

**Goal**: Expose standard-compliant Discovery and JWKS endpoints for client integration.

**Independent Test**: Verify `GET /.well-known/openid-configuration` and `GET /.well-known/keys` return expected JSON structures.

### Tests for User Story 1 (REQUIRED)

- [X] T005 [P] [US1] Create unit tests for Discovery endpoint in `apps/backend/tests/infra/http/discovery.test.ts`
- [X] T006 [P] [US1] Create unit tests for JWKS endpoint in `apps/backend/tests/infra/http/jwks.test.ts`

### Implementation for User Story 1

- [X] T007 [US1] Implement Discovery endpoint handler in `apps/backend/src/infra/http/controllers/discovery.controller.ts`
- [X] T008 [US1] Implement JWKS endpoint handler in `apps/backend/src/infra/http/controllers/jwks.controller.ts`
- [X] T009 [US1] Register discovery and keys routes in `apps/backend/src/index.ts`

**Checkpoint**: Discovery and keys endpoints are functional and testable independently.

---

## Phase 4: User Story 2 - Secure Authorization Initiation (Priority: P1)

**Goal**: Securely pre-register authorization requests (PAR) with full FAPI 2.0 validation.

**Independent Test**: Successfully execute a PAR request with a valid signed assertion and receive a `request_uri`.

### Tests for User Story 2 (REQUIRED)

- [X] T010 [P] [US2] Create unit tests for PAR use-case in `apps/backend/tests/core/use-cases/register-par.test.ts`
- [X] T011 [P] [US2] Create unit tests for PAR endpoint handler in `apps/backend/tests/infra/http/par.test.ts`
- [X] T011b [P] [US2] Create security validation suite for PAR (PKCE, DPoP, Assertions) in `apps/backend/tests/infra/http/par.security.test.ts`

### Implementation for User Story 2

- [X] T012 [P] [US2] Define Zod validation schema for PAR request in `apps/backend/src/infra/http/validators/par.validator.ts`
- [X] T013 [US2] Implement `RegisterParUseCase` with FAPI 2.0 validation (PKCE, DPoP, Binding) in `apps/backend/src/core/use-cases/register-par.ts`
- [X] T014 [US2] Implement `jti` replay protection logic using `used_jtis` table in `apps/backend/src/core/use-cases/register-par.ts`
- [X] T015 [US2] Implement PAR endpoint handler in `apps/backend/src/infra/http/controllers/par.controller.ts`
- [X] T016 [US2] Integrate security audit logging for PAR failures in `apps/backend/src/core/use-cases/register-par.ts`
- [X] T017 [US2] Register PAR route in `apps/backend/src/index.ts`
- [X] T018 [US2] Implement passive expiration filter for PAR/JTI lookups in `apps/backend/src/core/use-cases/register-par.ts`
- [X] T018b [US2] Implement DPoP-Nonce support and validation (FR-012) in `apps/backend/src/core/use-cases/register-par.ts`

**Checkpoint**: Secure PAR initiation is fully functional and integrated with SQLite.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and optimization

- [X] T019 Run full test suite: `bun test --coverage --threshold 80`
- [X] T020 Validate implementation against `specs/003-oidc-discovery-par/quickstart.md`
- [X] T021 [P] Ensure all secrets are masked in audit logs (Constitution Principle III)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Phase 1 completion.
- **User Stories (Phase 3 & 4)**: Depend on Foundational completion.
- **Polish (Phase 5)**: Depends on all user stories completion.

### Parallel Opportunities

- T005 & T006 (US1 Tests)
- T010, T011, & T011b (US2 Tests)
- T012 (Validator) can be developed in parallel with T013 (Use-case logic)

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 & 2 (Prerequisites).
2. Complete Phase 3 (Discovery Configuration).
3. **VALIDATE**: Ensure public endpoints work. This provides immediate value for client discovery.

### Incremental Delivery

1. Foundation ready.
2. Add Discovery (US1).
3. Add PAR (US2) with full FAPI 2.0 security.
4. Total FAPI 2.0 initiation layer complete.
