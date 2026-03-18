# Tasks: Singpass Compliance Remediation

**Feature**: Singpass Compliance Remediation
**Branch**: `035-singpass-remediation`
**Status**: Ready for Implementation
**Priority**: High (Security Compliance)

## Implementation Strategy

We will follow a priority-based incremental implementation, focusing on the high-severity security findings (Scope Enforcement and URL Safety) first. Each user story will be implemented as a complete slice including domain logic, use-case integration, and automated tests.

1. **Foundational Updates**: Extend the domain models and database schema to support the new metadata.
2. **Security Enforcements (P1)**: Implement strict scope and URL validation.
3. **Lifecycle Management (P2)**: Implement client activation and entity association.
4. **Verification**: Run comprehensive compliance tests against the mock provider.

## Dependencies

- [US1] Depends on Foundational Tasks (T003-T005)
- [US2] Depends on Foundational Tasks (T003-T005)
- [US3] Depends on Foundational Tasks (T003-T005)
- [US4] Depends on Foundational Tasks (T003-T005)
- Polish depends on completion of all User Stories.

## Phase 1: Setup

- [x] T001 Create compliance test directory in `apps/backend/tests/compliance`
- [x] T002 [P] Update shared configuration schema in `packages/shared/src/config.ts`

## Phase 2: Foundational

- [x] T003 Extend `ClientConfig` interface in `apps/backend/src/core/domain/client_registry.ts`
- [x] T004 [P] Add `clients` table to Drizzle schema in `apps/backend/src/infra/database/schema.ts`
- [x] T005 Update `HARDENED_CLIENT_REGISTRY` mock data in `apps/backend/src/infra/adapters/client_registry.ts`

## Phase 3: [US1] Scope Authorization Enforcement (P1)

**Goal**: Prevent unauthorized data access by validating requested scopes against an allowed list.

- [x] T006 [P] [US1] Implement `validateScopes` utility in `apps/backend/src/core/auth/validation.ts`
- [x] T007 [US1] Integrate scope validation in `RegisterParUseCase.execute` in `apps/backend/src/core/use-cases/register-par.ts`
- [x] T008 [P] [US1] Create unit tests for scope enforcement in `apps/backend/tests/compliance/scopes.test.ts`

**Independent Test**: `bun test tests/compliance/scopes.test.ts` (Verify `invalid_scope` error when unauthorized scopes are requested).

## Phase 4: [US2] Redirect URL Safety Enforcement (P1)

**Goal**: Prohibit IP addresses in URLs and enforce HTTPS to comply with Singpass security policies.

- [x] T009 [P] [US2] Implement `validateUrlSafe` utility (IP & HTTPS check) in `apps/backend/src/core/auth/validation.ts`
- [x] T010 [US2] Integrate URL safety validation in `RegisterParUseCase.execute` in `apps/backend/src/core/use-cases/register-par.ts`
- [x] T011 [P] [US2] Create unit tests for URL safety enforcement in `apps/backend/tests/compliance/urls.test.ts`

**Independent Test**: `bun test tests/compliance/urls.test.ts` (Verify rejection of IP-based URLs and non-HTTPS URLs in non-dev env).

## Phase 5: [US3] Client Activation Management (P2)

**Goal**: Enable administrative control over client access by checking activation status.

- [x] T012 [US3] Add `isActive` check to `RegisterParUseCase.execute` in `apps/backend/src/core/use-cases/register-par.ts`
- [x] T013 [US3] Add `isActive` check to Authorization flow in `apps/backend/src/infra/http/authRouter.ts`
- [x] T014 [US3] Add `isActive` check to Token exchange in `apps/backend/src/core/use-cases/token-exchange.ts` (or appropriate file)
- [x] T015 [P] [US3] Create unit tests for activation management in `apps/backend/tests/compliance/activation.test.ts`

**Independent Test**: `bun test tests/compliance/activation.test.ts` (Verify `unauthorized_client` error for deactivated clients).

## Phase 6: [US4] Entity and Metadata Association (P2)

**Goal**: Associate clients with UENs and store complete application metadata for administrative oversight.

- [x] T016 [US4] Update `DrizzleClientRegistry` to support new metadata fields in `apps/backend/src/infra/adapters/client_registry.ts`
- [x] T017 [US4] Implement test account limit warning (soft limit of 5) in user creation logic
- [x] T018 [P] [US4] Create integration tests for entity association and metadata retrieval in `apps/backend/tests/compliance/metadata.test.ts`

**Independent Test**: `bun test tests/compliance/metadata.test.ts` (Verify retrieval of UEN and metadata fields from registry).

## Phase 7: Polish & Cross-Cutting

- [x] T019 Final compliance audit run against local mock environment
- [x] T020 Update technical documentation in `docs/singpass-server/02-pushed-authorization-request.md`

## Parallel Execution Examples

### Example 1: Foundational & Schema
- T002 (Config Schema)
- T004 (DB Schema)

### Example 2: Validation Utilities (Phase 3 & 4)
- T006 (Scope Utility)
- T009 (URL Utility)

### Example 3: Compliance Testing (Phase 3 & 4)
- T008 (Scope Tests)
- T011 (URL Tests)
