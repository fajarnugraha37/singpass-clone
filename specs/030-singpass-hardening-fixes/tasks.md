# Tasks: 030-singpass-hardening-fixes

**Feature**: Remediate Singpass Compliance Audit Findings

This document outlines the actionable tasks required to implement the security and compliance hardening features as defined in the implementation plan.

## Phased Implementation

### Phase 1: Foundational (No-Op)
No foundational tasks are required for this feature as all changes are enhancements to existing components.

### Phase 2: DPoP Enhancements
- **Goal**: Enhance DPoP validation to include `exp` and `ath` claim checks.
- **Independent Test Criteria**: The system must reject DPoP proofs with invalid `exp` or `ath` claims.

- [X] T001 `[P]` [US1] Modify `DPoPValidator.validate` to accept an optional `accessToken` string in `apps/backend/src/core/utils/dpop_validator.ts`.
- [X] T002 `[US1]` Add logic to `DPoPValidator.validate` to check that the `exp` claim is no more than 2 minutes after the `iat` claim in `apps/backend/src/core/utils/dpop_validator.ts`.
- [X] T003 `[US1]` Add logic to `DPoPValidator.validate` to compute the SHA-256 hash of the `accessToken` and verify it against the `ath` claim if provided in `apps/backend/src/core/utils/dpop_validator.ts`.
- [X] T004 `[US1]` Create new unit tests in a new file `apps/backend/tests/core/utils/dpop_validator.test.ts` to cover the new `exp` and `ath` validation rules.

### Phase 3: JWKS Encryption Key
- **Goal**: Add an encryption key to the server's public JWKS.
- **Independent Test Criteria**: The `/jwks` endpoint must return a JWKS containing at least one key with `use: "enc"`.

- [X] T005 `[P]` [US1] Modify `DrizzleServerKeyManager.generateKeyPair` to allow specifying `use: 'enc'` in `apps/backend/src/infra/adapters/db/drizzle_key_manager.ts`.
- [X] T006 `[US1]` Ensure an encryption key is generated and stored upon initialization if one doesn't exist in `apps/backend/src/infra/adapters/db/drizzle_key_manager.ts`.
- [X] T007 `[US1]` Update `DrizzleServerKeyManager.getPublicJWKS` to include both signing and encryption keys in `apps/backend/src/infra/adapters/db/drizzle_key_manager.ts`.
- [X] T008 `[US1]` Update integration tests for the `/jwks` endpoint to assert the presence of an `enc` key in a new test file `apps/backend/tests/infra/http/jwks.test.ts`.

### Phase 4: Client Assertion Validation
- **Goal**: Enforce stricter validation rules for client assertions.
- **Independent Test Criteria**: The system must reject client assertions with non-compliant `iss`/`sub`, `aud`, `exp`, or a replayed `jti`.

- [X] T009 `[P]` [US1] Update `JoseCryptoService.validateClientAssertion` to add explicit checks for `iss === sub`, `exp - iat <= 120`, and `aud === sharedConfig.OIDC.ISSUER` in `apps/backend/src/infra/adapters/jose_crypto.ts`.
- [X] T010 `[US1]` Inject the generic `JtiStore` interface into `ClientAuthenticationService` in `apps/backend/src/core/application/services/client-auth.service.ts`.
- [X] T011 `[US1]` In `ClientAuthenticationService`, call the `jtiStore` to check and consume the `jti` from the client assertion to prevent replays in `apps/backend/src/core/application/services/client-auth.service.ts`.
- [X] T012 `[US1]` Add unit tests for the new validation logic in new test files `apps/backend/tests/infra/adapters/crypto_auth.test.ts` and `apps/backend/tests/unit/application/services/client-auth.service.test.ts`.

### Phase 5: PKCE Constraints
- **Goal**: Enforce length and character constraints on the PKCE `code_verifier`.
- **Independent Test Criteria**: The `/token` endpoint must reject requests with a non-compliant `code_verifier`.

- [X] T013 `[P]` [US2] Update the `tokenRequestSchema` in `apps/backend/src/infra/http/controllers/token.controller.ts` to add `.min(43)`, `.max(128)`, and `.regex(/^[A-Za-z0-9\-\._~]+$/)` to the `code_verifier` field.
- [X] T014 `[US2]` Update endpoint tests for `/token` to include cases with invalid `code_verifier` values in a new test file `apps/backend/tests/infra/http/token.test.ts`.

### Phase 6: OIDC Discovery Update
- **Goal**: Add encryption metadata to the OIDC discovery document.
- **Independent Test Criteria**: The `/.well-known/openid-configuration` endpoint must return the specified encryption metadata.

- [X] T015 `[P]` [US2] Add the required encryption algorithm fields to the response object in `apps/backend/src/infra/http/controllers/discovery.controller.ts`.
- [X] T016 `[US2]` Update the endpoint test for `/.well-known/openid-configuration` to assert the presence and correct values of the new fields in a new test file `apps/backend/tests/infra/http/discovery.test.ts`.

### Phase 7: Polish & Finalization
- **Goal**: Ensure all changes are integrated and the codebase is clean.
- [X] T017 Review all code changes for style, consistency, and adherence to the project constitution.
- [X] T018 Run all existing and new tests to ensure no regressions have been introduced.
- [X] T019 Update any relevant inline documentation or comments.

## Dependencies

The phases (DPoP, JWKS, Client Assertion, PKCE, OIDC) are largely independent and can be worked on in parallel.

- **Phase 2 (DPoP)** -> No dependencies
- **Phase 3 (JWKS)** -> No dependencies
- **Phase 4 (Client Assertion)** -> No dependencies
- **Phase 5 (PKCE)** -> No dependencies
- **Phase 6 (OIDC)** -> No dependencies

## Parallel Execution

Since the phases are independent, multiple developers or agents can work on them simultaneously.

- **Agent 1**: Can work on **Phase 2 (DPoP Enhancements)**.
- **Agent 2**: Can work on **Phase 3 (JWKS Encryption Key)**.
- **Agent 3**: Can work on **Phase 4 (Client Assertion Validation)**.
- **Agent 4**: Can work on **Phase 5 (PKCE Constraints)** and **Phase 6 (OIDC Discovery Update)**.

## Implementation Strategy

The suggested approach is to implement and test each phase independently. The MVP (Minimum Viable Product) for this feature would be the completion of all phases, as they are all required to meet the compliance audit findings. However, since the phases are independent, they can be delivered incrementally.
