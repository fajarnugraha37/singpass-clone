# Implementation Plan: 030-singpass-hardening-fixes

**Feature**: Remediate Singpass Compliance Audit Findings
**Author**: Gemini
**Date**: 2026-03-17

## 1. Technical Context

- **Language/Version**: TypeScript 5.x / Bun 1.1+
- **Primary Dependencies**: Hono, Drizzle ORM, Zod, `jose`
- **Database**: SQLite
- **Project Type**: Monorepo (Backend API)
- **Affected Files**:
  - `apps/backend/src/core/utils/dpop_validator.ts`
  - `apps/backend/src/infra/adapters/db/drizzle_key_manager.ts`
  - `apps/backend/src/infra/adapters/jose_crypto.ts`
  - `apps/backend/src/core/application/services/client-auth.service.ts`
  - `apps/backend/src/infra/http/controllers/token.controller.ts`
  - `apps/backend/src/infra/http/controllers/discovery.controller.ts`

## 2. Constitution Check (Pre-Design)

| Principle | Check | Status | Notes |
|---|---|---|---|
| I. Architecture | Adheres to Hexagonal Architecture | ✅ Pass | Changes will be implemented within existing architectural patterns (services, adapters, utils). |
| II. API Stability | No breaking changes to contracts | ✅ Pass | All changes are additive (new keys/metadata) or stricter validation, which is a compliant change, not a breaking one. |
| III. Security | Enforces security requirements | ✅ Pass | This entire feature is focused on enhancing security and compliance based on an audit. |
| V. AI Boundaries | Uses local docs as source of truth | ✅ Pass | The plan is based on the provided audit findings and does not require external lookups. |
| VI. Documentation | Spec-driven development | ✅ Pass | The implementation plan is derived directly from the approved specification. |

## 3. Phase 0: Research

The research phase confirmed that the recommendations from the audit report are the correct and necessary steps for achieving compliance. No alternative approaches were found to be viable.

**[`research.md`](./research.md)** has been created with detailed rationale.

## 4. Phase 1: Design & Contracts

### 4.1. Data Model & State

The data model for this feature focuses on the structure and validation of JWTs and public metadata, rather than database schema changes.

**[`data-model.md`](./data-model.md)** has been created to document the contracts for DPoP proofs, client assertions, JWKS, and the OIDC discovery document.

### 4.2. Interface Contracts

The public-facing contracts for the OIDC Discovery, JWKS, and Token endpoints have been documented.

- **[`contracts/oidc-discovery.md`](./contracts/oidc-discovery.md)**
- **[`contracts/jwks.md`](./contracts/jwks.md)**
- **[`contracts/token.md`](./contracts/token.md)**

### 4.3. Quickstart & Test Plan

A quickstart guide has been created to provide clear, step-by-step instructions for testing and verifying each of the implemented compliance fixes.

**[`quickstart.md`](./quickstart.md)** contains the detailed testing procedures.

## 5. Phase 2: Implementation (High-Level)

### Step 1: DPoP Enhancements
- **File**: `apps/backend/src/core/utils/dpop_validator.ts`
- **Action**:
  1. Modify the `validate` method to accept an optional `accessToken` string.
  2. Add logic to check the `exp` claim against the `iat` claim (must be <= 120s).
  3. If `accessToken` is provided, compute its SHA-256 hash and verify it against the `ath` claim in the DPoP payload.
- **Test**: Create new unit tests in `dpop_validator.test.ts` to cover these new validation rules.

### Step 2: Add Encryption Key to JWKS
- **File**: `apps/backend/src/infra/adapters/db/drizzle_key_manager.ts`
- **Action**:
  1. Modify `generateKeyPair` to allow specifying `use: 'enc'`.
  2. Ensure an encryption key is generated and stored upon initialization if one doesn't exist.
  3. Update `getPublicJWKS` to include both signing and encryption keys.
- **Test**: Update integration tests for the `/jwks` endpoint to assert the presence of an `enc` key.

### Step 3: Stricter Client Assertion Validation
- **Files**: `apps/backend/src/infra/adapters/jose_crypto.ts`, `apps/backend/src/core/application/services/client-auth.service.ts`
- **Action**:
  1. In `jose_crypto.ts`, update `validateClientAssertion` to add explicit checks for `iss === sub` and `exp - iat <= 120`.
  2. Inject the `PARRepository` (or a similar JTI-tracking mechanism) into `ClientAuthenticationService`.
  3. In `ClientAuthenticationService`, call the repository to check and consume the `jti` from the client assertion to prevent replays.
- **Test**: Add unit tests in `jose_crypto.test.ts` and `client-auth.service.test.ts` for the new validation logic.

### Step 4: Add PKCE Constraints
- **File**: `apps/backend/src/infra/http/controllers/token.controller.ts`
- **Action**:
  1. Update the `tokenRequestSchema` (Zod schema).
  2. Modify the `code_verifier` field to add `.min(43)`, `.max(128)`, and `.regex(/^[A-Za-z0-9\-\._~]+$/)`.
- **Test**: Update endpoint tests for `/token` to include cases with invalid `code_verifier` values.

### Step 5: Update OIDC Discovery
- **File**: `apps/backend/src/infra/http/controllers/discovery.controller.ts`
- **Action**:
  1. Add the following fields to the JSON response object:
     - `id_token_encryption_alg_values_supported`
     - `id_token_encryption_enc_values_supported`
     - `userinfo_encryption_alg_values_supported`
     - `userinfo_encryption_enc_values_supported`
- **Test**: Update the endpoint test for `/.well-known/openid-configuration` to assert the presence and correct values of these new fields.

## 6. Constitution Check (Post-Design)

| Principle | Check | Status | Notes |
|---|---|---|---|
| I. Architecture | Design adheres to Hexagonal Architecture | ✅ Pass | All implementation steps are localized to the correct layers (e.g., validation in controllers/services, crypto in adapters). |
| II. API Stability | Final contracts are not breaking | ✅ Pass | The documented contracts are compliant and non-breaking. |
| VI. Documentation | All design artifacts are complete | ✅ Pass | `research.md`, `data-model.md`, and `contracts` are all created and filled. |

All checks pass. The implementation plan is complete and ready for task breakdown.
