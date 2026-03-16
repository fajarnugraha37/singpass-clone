# Tasks: Singpass Clone Production Hardening

**Feature**: Singpass Clone Production Hardening  
**Branch**: `029-singpass-hardening`  
**Plan**: [plan.md](./plan.md)  
**Spec**: [spec.md](./spec.md)

## Phase 1: Setup (Shared Infrastructure)

**Goal**: Prepare the database and environment for production-grade security logic.

- [X] T001 Create `auth_codes` and `auth_sessions` table schemas in `apps/backend/src/db/schema.ts`
- [X] T002 Generate and apply SQLite migrations for the new tables via Drizzle
- [X] T003 [P] Add required environment variables (`OIDC_PRIVATE_KEY`, `OIDC_ISSUER`) to `apps/backend/.env.example`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Goal**: Implement core utilities and middleware needed by all user stories.

- [X] T004 Implement FAPI security headers middleware in `apps/backend/src/infra/middleware/fapi-headers.ts`
- [X] T005 [P] Implement `jose` helper for key loading and JWT signing in `apps/backend/src/core/security/jwt_utils.ts`
- [X] T006 [P] Implement scope-to-attribute mapping utility in `apps/backend/src/core/myinfo/scope_mapper.ts`
- [X] T007 Create compliance test suite skeleton in `apps/backend/tests/compliance/`

---

## Phase 3: User Story 1 - Security Audit and Remediation (Priority: P1)

**Goal**: Scan for placeholders and replace mocked OIDC logic with production-ready code.

**Independent Test**: Run `bun run harden:scan` and verify that detected placeholders are replaced and core auth flows pass initial unit tests.

- [X] T008 [US1] Create automated scan tool script in `scripts/harden_scan.ts` to identify patterns (`TODO`, `MOCK`, `FIXME`)
- [X] T009 [US1] Implement production S256 PKCE verification logic in `apps/backend/src/core/auth/pkce.ts`
- [X] T010 [US1] Integrate `jose` utility for secure ID Token signing in `apps/backend/src/core/auth/token_issuer.ts`
- [X] T011 [US1] Implement JWKS endpoint returning public keys in `apps/backend/src/adapters/endpoints/jwks.ts`
- [X] T012 [US1] Replace hardcoded UserInfo data with database retrieval in `apps/backend/src/adapters/endpoints/userinfo.ts`
- [X] T013 [US1] Remove `devMode` and `bypassAuth` flags from `apps/frontend/src/` components
- [X] T014 [US1] Apply FAPI headers middleware to all OIDC endpoints in `apps/backend/src/index.ts`

---

## Phase 4: User Story 2 - Compliance Enforcement (Priority: P1)

**Goal**: Enforce strict security invariants and ensure session persistence.

**Independent Test**: Attempt an authorization code replay attack and verify rejection with a 400 error. Verify session survives backend restart.

- [X] T015 [US2] Implement persistent PAR request storage using `auth_sessions` in `apps/backend/src/adapters/endpoints/par.ts`
- [X] T016 [US2] Enforce PAR `request_uri` requirement in `apps/backend/src/adapters/endpoints/authorize.ts`
- [X] T017 [US2] Implement atomic single-use code verification using `auth_codes` in `apps/backend/src/adapters/endpoints/token.ts`
- [X] T018 [US2] Implement strict exact-match validation for `redirect_uri` in `apps/backend/src/core/auth/validation.ts`
- [X] T019 [P] [US2] Add unit test for code replay protection in `apps/backend/tests/compliance/replay.test.ts`
- [X] T020 [P] [US2] Add unit test for nonce validation in `apps/backend/tests/compliance/nonce.test.ts`

---

## Phase 5: User Story 3 - MyInfo Data Minimization (Priority: P2)

**Goal**: Return only consented MyInfo attributes based on requested scopes.

**Independent Test**: Request a token with `openid profile` and verify UserInfo does not contain `birthcountry` or `mobileno`.

- [X] T021 [US3] Integrate `scope_mapper` into UserInfo retrieval logic in `apps/backend/src/core/auth/userinfo_service.ts`
- [X] T022 [US3] Filter MyInfo endpoint response strictly by authorized scopes in `apps/backend/src/adapters/endpoints/myinfo.ts`
- [X] T023 [P] [US3] Add unit test for scope-based data minimization in `apps/backend/tests/compliance/minimization.test.ts`

---

## Phase 6: Polish & Cross-Cutting Concerns

**Goal**: Final security cleanup and verification.

- [X] T024 Relocate remaining test mocks to `apps/backend/tests/mocks/`
- [X] T025 Implement secret masking logic in `apps/backend/src/utils/logger.ts` to prevent credential leakage
- [X] T026 Execute full compliance test suite and verify 100% pass rate across all OIDC endpoints
- [X] T027 Add JSDoc documentation to all hardened security modules

## Dependencies & Execution Order

1. **Phase 1 & 2** (Foundational) MUST be completed first.
2. **Phase 3 (US1)** provides the initial code replacements.
3. **Phase 4 (US2)** builds on the replaced logic to enforce strict invariants.
4. **Phase 5 (US3)** handles privacy-specific data filtering.
5. **Phase 6** (Polish) finalizes the implementation.

## Parallel Execution

- T003 (Env setup) can run while T001/T002 (DB setup) are in progress.
- T005 and T006 (Utilities) can be implemented simultaneously.
- Compliance tests (T019, T020, T023) can be written in parallel with their respective implementations.

## Implementation Strategy

### MVP First
Complete **Phases 1, 2, and 3** to establish a production-ready, placeholder-free baseline for OIDC authentication.

### Incremental Delivery
1. **Milestone 1**: Database schema and core security utilities (Phase 1 & 2).
2. **Milestone 2**: Resolution of all codebase placeholders and mock replacements (Phase 3).
3. **Milestone 3**: Enforcement of FAPI security invariants and session persistence (Phase 4).
4. **Milestone 4**: Privacy-first MyInfo data minimization (Phase 5).
