# Tasks: Remediate Singpass Compliance Audit Findings

**Feature**: 031-fix-singpass-audit
**Implementation Plan**: [plan.md](plan.md)

## Implementation Strategy

We will remediate the Singpass compliance audit findings using an incremental, test-driven approach. 
First, we update the shared configurations and infrastructure (foundational). 
Then, we implement each user story with its corresponding tests, ensuring independent testability and delivery of value.

## Phase 1: Setup (Infrastructure & Configuration)

- [ ] T001 Update `PAR_TTL_SECONDS` to 60 in `packages/shared/src/config.ts`
- [ ] T002 Update `parRequestSchema` with `state.min(30)`, `nonce.min(30)`, and optional native app parameters in `packages/shared/src/config.ts`

## Phase 2: Foundational (Prerequisites)

- [ ] T003 [P] Add `account_type` column to `users` table in `apps/backend/src/infra/database/schema.ts`
- [ ] T004 [P] Update `FapiErrors` to include `useDpopNonce` helper with 401 status and `WWW-Authenticate` header in `apps/backend/src/infra/middleware/fapi-error.ts`
- [ ] T005 [P] Update `DPoPValidator` to support `expectedNonce` validation in `apps/backend/src/core/utils/dpop_validator.ts`

## Phase 3: [US1] Secure Pushed Authorization (Priority: P1)

**Goal**: Shorten PAR TTL, enforce entropy minimums, and issue server-provided DPoP nonces.

- [ ] T006 [US1] Create integration test for PAR compliance (TTL, state/nonce length, DPoP-Nonce issuance) in `apps/backend/tests/integration/par_compliance.test.ts`
- [ ] T007 [US1] Update `RegisterParUseCase` to use `sharedConfig.SECURITY.PAR_TTL_SECONDS` and call `cryptoService.generateDPoPNonce()` in `apps/backend/src/core/use-cases/register-par.ts`
- [ ] T008 [US1] Update `parController` to include `DPoP-Nonce` header in the response in `apps/backend/src/infra/http/controllers/par.controller.ts`

**Independent Test**: Run `bun test tests/integration/par_compliance.test.ts`.

## Phase 4: [US2] Fresh DPoP-bound Token Exchange (Priority: P1)

**Goal**: Enforce server-provided nonces in DPoP proofs for token exchange.

- [ ] T009 [US2] Create integration test for Token exchange DPoP-Nonce enforcement in `apps/backend/tests/integration/token_compliance.test.ts`
- [ ] T010 [US2] Update `TokenExchangeUseCase` to validate `DPoP-Nonce` freshness in `apps/backend/src/core/use-cases/token-exchange.ts`
- [ ] T011 [US2] Update `token.controller.ts` to return `DPoP-Nonce` header and handle `use_dpop_nonce` error in `apps/backend/src/infra/http/controllers/token.controller.ts`

**Independent Test**: Run `bun test tests/integration/token_compliance.test.ts`.

## Phase 5: [US3] Accurate User Identity Attributes (Priority: P2)

**Goal**: Propagate user account type (standard/foreign) to ID Token claims.

- [ ] T012 [US3] Create unit test for ID Token `account_type` mapping in `apps/backend/tests/unit/claims_mapping.test.ts`
- [ ] T013 [US3] Add `account_type` to `UserAttributes` and `SubAttributes` in `apps/backend/src/core/domain/claims.ts`
- [ ] T014 [US3] Update `buildSubAttributes` mapping logic to use `user.account_type` instead of hardcoded value in `apps/backend/src/core/domain/claims.ts`

**Independent Test**: Run `bun test tests/unit/claims_mapping.test.ts`.

## Phase 6: Polish & Verification

- [ ] T015 Run full verification suite including all integration tests and audit fix validation in `apps/backend`

## Dependencies

- Phase 1 must precede Phase 2 & 3.
- Phase 2 must precede Phase 3 & 4.
- [US1] and [US2] can be developed in parallel after Foundational phase, but [US2] usually depends on the nonce issuance mechanism established in [US1].

## Parallel Execution Examples

- **Example 1**: Developer A works on Foundational schema changes (T003) while Developer B updates Shared Config (T001, T002).
- **Example 2**: Once Foundational is complete, Developer A implements PAR compliance [US1] while Developer B implements Claims mapping [US3].
