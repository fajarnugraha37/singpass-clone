# Tasks: FAPI 2.0 Database Schema and Core Utilities

**Feature**: FAPI 2.0 Database Schema and Core Utilities
**Branch**: `002-fapi-core-infra`
**Plan**: [plan.md](plan.md)
**Status**: Ready for Implementation

## Implementation Strategy

We will implement this foundational layer in four phases:
1. **Setup & Foundational**: Database schema and core encryption utilities.
2. **User Story 1 & 2 (P1)**: Client Authentication and PAR lifecycle. These are the core blocking flows.
3. **User Story 3 & 4 (P2)**: Session/2FA tracking and DPoP binding.
4. **Polish**: Final integration, comprehensive audit logging, and cleanup.

Each user story phase is designed to be independently testable using the `CryptoService` and `AuthDataService` contracts.

## Phase 1: Setup

- [x] T001 Initialize backend directory structure per Hexagonal Architecture in `apps/backend/src/`
- [x] T002 Configure Drizzle ORM and SQLite client in `apps/backend/src/infra/database/client.ts`
- [x] T003 Implement AES-256-GCM encryption utility for server keys in `apps/backend/src/infra/adapters/encryption.ts`

## Phase 2: Foundational (Database Schema)

- [x] T004 [P] Define Drizzle schema for `users` and `sessions` in `apps/backend/src/infra/database/schema.ts`
- [x] T005 [P] Define Drizzle schema for `par_requests` and `auth_codes` in `apps/backend/src/infra/database/schema.ts`
- [x] T006 [P] Define Drizzle schema for `server_keys` and `security_audit_log` in `apps/backend/src/infra/database/schema.ts`
- [x] T007 Generate and run Drizzle migrations to initialize SQLite database

## Phase 3: User Story 1 - Secure Client Authentication (P1)

**Goal**: Implement `private_key_jwt` validation and JWKS management.
**Independent Test**: Submit a valid signed JWT to the validation utility and verify against mock registry.

- [x] T008 [US1] Define `CryptoService` interface in `apps/backend/src/core/domain/crypto_service.ts`
- [x] T009 [US1] Implement mock client registry (static config) in `apps/backend/src/infra/adapters/client_registry.ts`
- [x] T010 [US1] Implement `generateKeyPair` and `getPublicJWKS` in `apps/backend/src/infra/adapters/jose_crypto.ts`
- [x] T011 [US1] Implement `validateClientAssertion` (private_key_jwt) in `apps/backend/src/infra/adapters/jose_crypto.ts`
- [x] T012 [US1] Create unit tests for `private_key_jwt` validation in `apps/backend/tests/infra/adapters/crypto_auth.test.ts`

## Phase 4: User Story 2 - Pushed Authorization Request (PAR) Lifecycle (P1)

**Goal**: Implement secure storage and retrieval of PAR parameters.
**Independent Test**: Persist parameters and retrieve them using a sequential `request_uri`.

- [x] T013 [US2] Define `AuthDataService` interface in `apps/backend/src/core/domain/auth_data_service.ts`
- [x] T014 [US2] Implement `createPAR` with sequential URI generation in `apps/backend/src/infra/adapters/drizzle_auth_data.ts`
- [x] T015 [US2] Implement `getPAR` with TTL (60s) enforcement in `apps/backend/src/infra/adapters/drizzle_auth_data.ts`
- [x] T016 [US2] Create Zod schemas for PAR payload validation in `packages/shared/src/config.ts`
- [x] T017 [US2] Create unit tests for PAR lifecycle in `apps/backend/tests/infra/adapters/par.test.ts`

## Phase 5: User Story 3 - Session Tracking with 2FA (P2)

**Goal**: Track authentication progress and LOA levels.
**Independent Test**: Update a session's LOA and verify persistence.

- [x] T018 [US3] Implement `createSession` and `updateSession` in `apps/backend/src/infra/adapters/drizzle_auth_data.ts`
- [x] T019 [US3] Implement session retrieval with expiry check in `apps/backend/src/infra/adapters/drizzle_auth_data.ts`
- [x] T020 [US3] Create unit tests for session state transitions in `apps/backend/tests/core/application/session.test.ts`

## Phase 6: User Story 4 - DPoP Token Binding (P2)

**Goal**: Bind public keys to sessions and validate DPoP proofs.
**Independent Test**: Bind a thumbprint and validate a DPoP proof against it.

- [ ] T021 [US4] Implement `calculateThumbprint` (RFC 7638) in `apps/backend/src/infra/adapters/jose_crypto.ts`
- [ ] T022 [US4] Implement `validateDPoPProof` (signature, iat, jti, htm, htu) in `apps/backend/src/infra/adapters/jose_crypto.ts`
- [ ] T023 [US4] Implement `issueAuthCode` and `exchangeAuthCode` with DPoP binding in `apps/backend/src/infra/adapters/drizzle_auth_data.ts`
- [ ] T024 [US4] Create unit tests for DPoP binding and proof validation in `apps/backend/tests/infra/adapters/dpop.test.ts`

## Phase 7: Polish & Audit Logging

- [ ] T025 Define `SecurityAuditService` interface in `apps/backend/src/core/domain/audit_service.ts`
- [ ] T026 Implement `SecurityAuditService` with dual-logging (DB + JSON console) in `apps/backend/src/infra/adapters/security_logger.ts`
- [ ] T027 Integrate audit logging into `jose_crypto.ts` and `drizzle_auth_data.ts`
- [ ] T028 Implement periodic cleanup job for expired PARs and AuthCodes in `apps/backend/src/infra/database/cleanup.ts`

## Dependencies

1. **Foundational (T001-T007)**: Must be completed first to provide the DB layer.
2. **Client Auth (US1)** and **PAR (US2)** are P1 and can be worked on in parallel once Foundational is done.
3. **Session (US3)** depends on **PAR (US2)** for initial request data.
4. **DPoP (US4)** depends on **Session (US3)** for binding context.
5. **Audit Logging** can be implemented last but depends on all domain services.

## Parallel Execution Examples

- **Setup & Foundational**: (T001, T002, T003) -> T004, T005, T006
- **User Story 1 (Client Auth)**: T008, T009, T010, T011, T012
- **User Story 2 (PAR)**: T013, T014, T015, T016, T017
