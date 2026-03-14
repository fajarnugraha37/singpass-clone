# FINDINGS → Specification Kit

**Source**: `FINDINGS.md` (Audit: 2026-03-14)  
**Purpose**: Transform each finding into an actionable, self-contained spec that an AI agent or developer can pick up and implement independently.

> Each spec below follows the project's convention: problem statement, affected files, acceptance criteria, and a concrete task list.

---

## SPEC-F01: JWKS Public Key Export Security Audit

**Finding**: #1 (🔴 Critical)  
**Branch Suggestion**: `fix/jwks-public-key-export`

### Problem

`getPublicJWKS()` in `JoseCryptoService` calls `jose.exportJWK(privateKey)` which may include the private key component `d` in the output. The key is imported with `{ extractable: true }`, increasing risk.

### Affected Files

| File | Change |
|------|--------|
| `apps/backend/src/infra/adapters/jose_crypto.ts` | Strip `d` from exported JWK in `getPublicJWKS()` |
| `apps/backend/tests/infra/adapters/jwks_export.test.ts` | New test: verify `d` is never present |

### Acceptance Criteria

1. `GET /.well-known/keys` MUST return JWK objects containing ONLY public key components: `kty`, `crv`, `x`, `y`, `kid`, `use`, `alg`.
2. The `d` (private key) component MUST NOT be present in any key returned by the JWKS endpoint.
3. A unit test MUST explicitly assert that `d` is absent from every key in the exported JWKS.

### Tasks

- [ ] T01 In `getPublicJWKS()`, destructure the exported JWK and explicitly remove `d` before adding to the keys array.
- [ ] T02 Add unit test that generates a key pair, calls `getPublicJWKS()`, and asserts `d` is undefined for each key.
- [ ] T03 Add integration test hitting `GET /.well-known/keys` asserting no key contains `d`.

---

## SPEC-F02: PAR `authentication_context_type` Validation

**Finding**: #2 (🟡 Medium)  
**Branch Suggestion**: `fix/par-auth-context-type`

### Problem

The `parRequestSchema` does not include `authentication_context_type`, which is mandatory for Login apps per the Singpass spec.

### Doc Reference

`docs/singpass/technical-specifications/integration-guide/1.-authorization-request.md` → Singpass-Specific Parameters section.

### Affected Files

| File | Change |
|------|--------|
| `packages/shared/src/config.ts` | Add `authentication_context_type` (optional string) and `authentication_context_message` (optional string) to `parRequestSchema` |
| `apps/backend/src/core/use-cases/register-par.ts` | Validate that `authentication_context_type` is present when client is a Login app |
| `apps/backend/tests/core/use-cases/register-par.test.ts` | Add test cases for missing/invalid `authentication_context_type` |

### Valid Enum Values (from docs)

```
APP_AUTHENTICATION_DEFAULT, APP_PAYMENT_DEFAULT, APP_ACCOUNT_PASSWORD_CHANGE_DEFAULT,
APP_ACCOUNT_PASSWORD_RESET_DEFAULT, APP_ACCOUNT_DETAILS_CHANGE_DEFAULT,
APP_ONBOARDING_DEFAULT, BANK_CASA_OPENING, BANK_FUNDS_TRANSFER_LOCAL, ...
```

### Acceptance Criteria

1. `parRequestSchema` MUST accept an optional `authentication_context_type` string field.
2. `parRequestSchema` MUST accept an optional `authentication_context_message` string field (max 100 chars, allowed chars: `A-Za-z0-9 .,-@'!()`).
3. When the client is a Login app, `authentication_context_type` MUST be required (throw `invalid_request` if missing).
4. The field value MUST be stored in the PAR payload for later reference.

### Tasks

- [ ] T01 Add `authentication_context_type` and `authentication_context_message` to `parRequestSchema` in `packages/shared/src/config.ts`.
- [ ] T02 Add validation logic in `RegisterParUseCase` to enforce mandatory check for Login apps.
- [ ] T03 Add test: PAR from Login app without `authentication_context_type` → `invalid_request`.
- [ ] T04 Add test: PAR with valid `authentication_context_type` → accepted.

---

## SPEC-F03: PAR `redirect_uri` Registration Validation

**Finding**: #3 (🟠 High)  
**Branch Suggestion**: `fix/par-redirect-uri-validation`

### Problem

`redirect_uri` is validated as a URL format by Zod but never checked against the client's pre-registered redirect URIs during PAR.

### Affected Files

| File | Change |
|------|--------|
| `apps/backend/src/core/use-cases/register-par.ts` | Call `validateRedirectUri()` during PAR registration |
| `apps/backend/src/core/domain/client_registry.ts` | Ensure `ClientConfig.redirectUris` is always available |
| `apps/backend/tests/core/use-cases/register-par.test.ts` | Add test for unregistered redirect_uri |

### Acceptance Criteria

1. During PAR registration, `redirect_uri` MUST be validated against the client's `redirectUris` list from the `ClientRegistry`.
2. If `redirect_uri` does not match any registered URI, the server MUST return `invalid_request` error.
3. Matching MUST be exact string comparison (no wildcards).

### Tasks

- [ ] T01 Inject `ClientRegistry` into `RegisterParUseCase` (or use existing `CryptoService.validateRedirectUri()`).
- [ ] T02 Call redirect URI validation after client authentication in `register-par.ts`.
- [ ] T03 Add test: PAR with unregistered `redirect_uri` → `invalid_request`.
- [ ] T04 Add test: PAR with registered `redirect_uri` → accepted.

---

## SPEC-F04: Auth Error Redirect Compliance

**Finding**: #4 (🟢 Low)  
**Branch Suggestion**: `fix/auth-error-redirect`

### Problem

Auth errors during login/2FA return JSON responses instead of redirecting to the client's `redirect_uri` with error parameters per OIDC spec (Section 3.1.2.6).

### Affected Files

| File | Change |
|------|--------|
| `apps/backend/src/core/use-cases/Validate2FA.ts` | On final failure, construct redirect URL with error params |
| `apps/backend/src/core/use-cases/ValidateLogin.ts` | On final failure, construct redirect URL with error params |
| `apps/backend/src/infra/http/controllers/auth.controller.ts` | Handle redirect-based error responses |

### Acceptance Criteria

1. When user authentication permanently fails (max retries exceeded), the server SHOULD redirect to `redirect_uri?error=access_denied&state={state}`.
2. Temporary failures (wrong password, wrong OTP) MAY continue to return JSON responses since the frontend handles them.
3. The `state` parameter from the original PAR request MUST be included in error redirects.

### Tasks

- [ ] T01 In `Validate2FA`, on session expiry or permanent failures, return a redirect URL instead of JSON error.
- [ ] T02 In `auth.controller.ts`, detect redirect-type errors and perform HTTP redirect.
- [ ] T03 Add integration test: expired session → redirect with `error=access_denied`.

---

## SPEC-F05: ID Token Missing Claims (`acr`, `amr`, `sub_type`, `sub_attributes`)

**Finding**: #5 (🟠 High)  
**Branch Suggestion**: `fix/id-token-claims`

### Problem

ID Token is missing mandatory FAPI 2.0/Singpass claims: `acr`, `amr`, `sub_type`, and conditional `sub_attributes`.

### Doc Reference

`docs/singpass/technical-specifications/integration-guide/4.-parsing-the-id-token.md`

### Affected Files

| File | Change |
|------|--------|
| `apps/backend/src/core/utils/crypto.ts` | Extend `IDTokenClaims` interface with `acr`, `amr`, `sub_type`, `sub_attributes` |
| `apps/backend/src/core/application/services/token.service.ts` | Populate `acr`, `amr`, `sub_type`, `sub_attributes` based on auth session and scopes |
| `apps/backend/src/core/domain/authorizationCode.ts` | Add `acr` and `amr` fields |
| `apps/backend/src/infra/database/schema.ts` | Add `acr` and `amr` columns to `authorization_codes` table |
| `apps/backend/src/core/use-cases/GenerateAuthCode.ts` | Set `acr` and `amr` from auth session |
| `apps/backend/src/core/use-cases/Validate2FA.ts` | Record `acr` and `amr` values on successful 2FA |
| `apps/backend/tests/core/crypto.test.ts` | Verify new claims in generated ID Token |

### Claim Definitions

| Claim | Type | Values |
|-------|------|--------|
| `acr` | string | `urn:singpass:authentication:loa:1` (staging pwd-only), `urn:singpass:authentication:loa:2` (2FA), `urn:singpass:authentication:loa:3` (face) |
| `amr` | string[] | `["pwd"]`, `["pwd", "otp-sms"]`, `["pwd", "face"]`, `["pwd", "swk"]`, `["pwd", "hwk"]` |
| `sub_type` | string | Always `"user"` |
| `sub_attributes` | object | Conditional on scopes — see matrix below |

### `sub_attributes` Scope Matrix

| Scope | `sub_attributes` Field | Source |
|-------|----------------------|--------|
| `user.identity` | `identity_number` | `users.nric` |
| `user.identity` | `identity_coi` | Hardcode `"SG"` for MVP |
| `user.identity` | `account_type` | Hardcode `"standard"` for MVP |
| `name` | `name` | `users.name` |
| `email` | `email` | `users.email` |
| `mobileno` | `mobileno` | `users.mobileno` (requires SPEC-F14) |

### Acceptance Criteria

1. Every ID Token MUST contain `acr` with the correct LOA value.
2. Every ID Token MUST contain `amr` as an array of strings reflecting actual authentication methods used.
3. Every ID Token MUST contain `sub_type: "user"`.
4. When scopes `user.identity`, `name`, `email`, or `mobileno` are requested, the ID Token MUST contain a `sub_attributes` object with the corresponding fields.
5. When only `openid` scope is requested, `sub_attributes` SHOULD be omitted.

### Tasks

- [ ] T01 Extend `IDTokenClaims` interface in `crypto.ts` with `acr`, `amr`, `sub_type`, `sub_attributes`.
- [ ] T02 Add `acr: string` and `amr: string[]` fields to `AuthorizationCode` interface.
- [ ] T03 Add `acr` and `amr` columns to `authorization_codes` DB table.
- [ ] T04 In `Validate2FA`, set `acr = 'urn:singpass:authentication:loa:2'` and `amr = ['pwd', 'otp-sms']` on success.
- [ ] T05 In `GenerateAuthCode`, propagate `acr` and `amr` from session to auth code.
- [ ] T06 In `TokenService.generateTokens()`, populate `acr`, `amr`, `sub_type` from auth code data.
- [ ] T07 In `TokenService.generateTokens()`, build `sub_attributes` based on scopes (requires SPEC-F14 first).
- [ ] T08 Add unit test verifying `acr` and `amr` appear in decoded ID Token.
- [ ] T09 Add unit test verifying `sub_attributes` is populated when relevant scopes are present.

---

## SPEC-F06: Access Token Expiry Alignment

**Finding**: #6 (🟡 Medium)  
**Branch Suggestion**: `fix/token-expiry-alignment`

### Problem

`expires_in` in the token response is `3600` (1 hour) but the Singpass doc specifies 30 minutes (1800 seconds).

### Affected Files

| File | Change |
|------|--------|
| `packages/shared/src/config.ts` | Update `ACCESS_TOKEN_TTL` to `1800` |
| `apps/backend/src/core/use-cases/token-exchange.ts` | Use config value for token expiry |
| `apps/backend/src/core/application/services/token.service.ts` | Use config value for `expires_in` |

### Acceptance Criteria

1. `expires_in` in the token response MUST be `1800`.
2. Access tokens MUST expire 30 minutes after issuance.
3. The value MUST be configurable via `sharedConfig.SECURITY`.

### Tasks

- [ ] T01 Update `ACCESS_TOKEN_TTL` constant to `1800` in shared config.
- [ ] T02 Verify all token generation and storage code uses the config value.
- [ ] T03 Add test that verifies the token response `expires_in` matches 1800.

---

## SPEC-F07: UserInfo `WWW-Authenticate` Headers

**Finding**: #8 (🟡 Medium)  
**Branch Suggestion**: `fix/userinfo-www-authenticate`

### Problem

UserInfo endpoint only sets `WWW-Authenticate` header for missing Authorization header, but not for `invalid_token` or `invalid_dpop_proof` errors as required by Singpass spec.

### Doc Reference

`docs/singpass/technical-specifications/integration-guide/5.-requesting-for-userinfo.md`: "These parameters will also be returned in the `WWW-Authenticate` header."

### Affected Files

| File | Change |
|------|--------|
| `apps/backend/src/infra/http/controllers/userinfo.controller.ts` | Add `WWW-Authenticate` header to all 401 responses |

### Expected Header Format

```
WWW-Authenticate: DPoP error="invalid_token", error_description="The access token is expired"
WWW-Authenticate: DPoP error="invalid_dpop_proof", error_description="DPoP proof signature invalid"
```

### Acceptance Criteria

1. All 401 responses from `/userinfo` MUST include a `WWW-Authenticate` header.
2. The header MUST use the format `DPoP error="<code>", error_description="<desc>"`.
3. Applicable error codes: `invalid_request`, `invalid_token`, `invalid_dpop_proof`.

### Tasks

- [ ] T01 Create a helper function `buildWWWAuthenticateHeader(error, description)` in `userinfo.controller.ts`.
- [ ] T02 Set `WWW-Authenticate` header on every 401 response path in the UserInfo controller.
- [ ] T03 Add integration test: expired token → 401 with `WWW-Authenticate: DPoP error="invalid_token"`.
- [ ] T04 Add integration test: bad DPoP → 401 with `WWW-Authenticate: DPoP error="invalid_dpop_proof"`.

---

## SPEC-F08: DPoP Validator Consolidation

**Finding**: #9 (🟠 High)  
**Branch Suggestion**: `fix/dpop-consolidation`

### Problem

Three separate DPoP validation implementations exist with inconsistencies: `dpop.ts` has relaxed `htu` checking and no JTI replay protection.

### Current Implementations

| File | Used By | `htu` Check | `jti` Replay |
|------|---------|-------------|--------------|
| `core/utils/dpop.ts` | Token exchange | ❌ Relaxed | ❌ Missing |
| `core/utils/dpop_validator.ts` | UserInfo | ✅ Strict | ✅ Present |
| `infra/adapters/jose_crypto.ts` | PAR | ✅ Strict | ✅ Present |

### Affected Files

| File | Change |
|------|--------|
| `apps/backend/src/core/utils/dpop_validator.ts` | Canonical implementation — keep and enhance |
| `apps/backend/src/core/utils/dpop.ts` | **DELETE** — replace all usages with `DPoPValidator` |
| `apps/backend/src/infra/adapters/jose_crypto.ts` | Remove `validateDPoPProof()` — delegate to `DPoPValidator` |
| `apps/backend/src/core/domain/crypto_service.ts` | Remove `validateDPoPProof()` from `CryptoService` interface |
| `apps/backend/src/core/use-cases/token-exchange.ts` | Use `DPoPValidator` instead of `validateDPoPProof()` from `dpop.ts` |
| `apps/backend/src/core/use-cases/register-par.ts` | Use `DPoPValidator` instead of `cryptoService.validateDPoPProof()` |
| `apps/backend/src/index.ts` | Wire up single `DPoPValidator` instance for all consumers |
| `apps/backend/tests/infra/adapters/dpop.test.ts` | Consolidate DPoP tests |

### Acceptance Criteria

1. There MUST be exactly ONE DPoP validation implementation: `DPoPValidator` in `core/utils/dpop_validator.ts`.
2. All endpoints (PAR, Token, UserInfo) MUST use the same `DPoPValidator`.
3. `htu` validation MUST be strict (exact match) in all cases.
4. `jti` replay protection MUST be enforced in all cases.
5. `dpop.ts` MUST be deleted.
6. `CryptoService.validateDPoPProof()` MUST be removed from the interface and implementation.

### Tasks

- [ ] T01 Review and enhance `DPoPValidator` to accept all parameters needed by PAR, Token, and UserInfo.
- [ ] T02 Update `token-exchange.ts` to use `DPoPValidator` instead of `validateDPoPProof()` from `dpop.ts`.
- [ ] T03 Update `register-par.ts` to use `DPoPValidator` instead of `cryptoService.validateDPoPProof()`.
- [ ] T04 Remove `validateDPoPProof()` from `CryptoService` interface and `JoseCryptoService` implementation.
- [ ] T05 Delete `apps/backend/src/core/utils/dpop.ts`.
- [ ] T06 Update `index.ts` to inject a single `DPoPValidator` into all use cases.
- [ ] T07 Consolidate and update all DPoP-related tests.
- [ ] T08 Run full test suite and verify no regressions.

---

## SPEC-F09: Mock Client Registry — Add Encryption Key

**Finding**: #10 (🟡 Medium)  
**Branch Suggestion**: `fix/mock-client-enc-key`

### Problem

`mock-client-id` in the client registry only has a signature key but no encryption key, causing ID Token generation to fail.

### Affected Files

| File | Change |
|------|--------|
| `apps/backend/src/infra/adapters/client_registry.ts` | Add encryption key to `mock-client-id` |

### Acceptance Criteria

1. `mock-client-id` MUST have both a `sig` key (ES256) and an `enc` key (ECDH-ES+A256KW).
2. Token exchange for `mock-client-id` MUST succeed without `"Client public encryption key not found"` error.

### Tasks

- [ ] T01 Generate or copy an EC P-256 encryption key and add to `mock-client-id.jwks.keys[]` with `use: 'enc'` and `alg: 'ECDH-ES+A256KW'`.
- [ ] T02 Verify token exchange works for `mock-client-id` in dev/test.

---

## SPEC-F10: Client Registry Access Pattern Consistency

**Finding**: #11 (🟢 Low)  
**Branch Suggestion**: `fix/client-registry-consistency`

### Problem

Two access patterns exist: `DrizzleClientRegistry` class (async, port-based) and `getClientConfig()` function (sync, direct). Some code bypasses the hexagonal architecture.

### Affected Files

| File | Change |
|------|--------|
| `apps/backend/src/infra/adapters/client_registry.ts` | Remove bare `getClientConfig()` function export |
| `apps/backend/src/infra/adapters/jose_crypto.ts` | Use injected `ClientRegistry` port instead of direct import |
| `apps/backend/src/core/application/services/token.service.ts` | Inject `ClientRegistry` port |
| `apps/backend/src/index.ts` | Wire `ClientRegistry` into all services |

### Acceptance Criteria

1. All client config access MUST go through the `ClientRegistry` port interface.
2. The bare `getClientConfig()` function MUST be removed.
3. `JoseCryptoService.validateRedirectUri()` MUST use the injected `ClientRegistry`.

### Tasks

- [ ] T01 Remove `getClientConfig()` function from `client_registry.ts`.
- [ ] T02 Inject `ClientRegistry` into `JoseCryptoService` constructor.
- [ ] T03 Update `validateRedirectUri()` to use the injected registry.
- [ ] T04 Wire all dependencies in `index.ts`.
- [ ] T05 Run tests to verify no regressions.

---

## SPEC-F11: Missing Error Types in FapiErrors

**Finding**: #12 (🟢 Low)  
**Branch Suggestion**: `fix/error-types`

### Problem

`server_error`, `temporarily_unavailable`, and `invalid_token` are specified by Singpass but not defined in `FapiErrors` or `tokenErrorResponseSchema`.

### Affected Files

| File | Change |
|------|--------|
| `apps/backend/src/infra/middleware/fapi-error.ts` | Add `serverError`, `temporarilyUnavailable`, `invalidToken` to `FapiErrors` |
| `packages/shared/src/tokens.ts` | Add `server_error`, `temporarily_unavailable`, `invalid_token` to `tokenErrorResponseSchema` enum |

### Acceptance Criteria

1. `tokenErrorResponseSchema` MUST include all error codes from the Singpass spec.
2. `FapiErrors` helper MUST have factory methods for all specified error codes.

### Tasks

- [ ] T01 Add `server_error`, `temporarily_unavailable`, `invalid_token` to the `tokenErrorResponseSchema` enum.
- [ ] T02 Add `serverError()`, `temporarilyUnavailable()`, `invalidToken()` to `FapiErrors`.
- [ ] T03 Update existing error throws in UserInfo controller to use `FapiErrors.invalidToken()`.

---

## SPEC-F12: Duplicate Route Cleanup

**Finding**: #13 (🟡 Medium)  
**Branch Suggestion**: `fix/route-cleanup`

### Problem

Token and UserInfo endpoints are mounted at multiple paths, creating confusion and expanding attack surface.

### Current State

```
/token                → token handler     (root-level, line 107)
/api/token            → token handler     (api router)
/userinfo             → userinfo handler  (root-level, lines 108-109)
/api/userinfo         → userinfo handler  (api router)
/auth/userinfo        → userinfo handler  (auth router)
/api/auth/userinfo    → userinfo handler  (auth router under api)
```

### Discovery Doc Advertises

```
token_endpoint:    ${baseUrl}/api/token
userinfo_endpoint: ${baseUrl}/api/userinfo
```

### Affected Files

| File | Change |
|------|--------|
| `apps/backend/src/index.ts` | Remove root-level `/token` and `/userinfo` route definitions |
| `apps/backend/src/infra/http/authRouter.ts` | Remove `/userinfo` from auth router (keep only in API router) |

### Acceptance Criteria

1. Token endpoint MUST be accessible ONLY at `/api/token`.
2. UserInfo endpoint MUST be accessible ONLY at `/api/userinfo`.
3. Discovery document URLs MUST match actual endpoint paths.
4. Root-level and auth-router duplicate mounts MUST be removed.

### Tasks

- [ ] T01 Remove `app.post('/token', ...)` from `index.ts` root-level.
- [ ] T02 Remove `app.get('/userinfo', ...)` and `app.post('/userinfo', ...)` from `index.ts` root-level.
- [ ] T03 Remove `.get('/userinfo', ...)` and `.post('/userinfo', ...)` from `authRouter.ts`.
- [ ] T04 Verify `/api/token` and `/api/userinfo` remain functional.
- [ ] T05 Update integration tests if they use the old paths.

---

## SPEC-F13: Scope Propagation Fix (Critical Pipeline)

**Finding**: #14 (🔴 Critical)  
**Branch Suggestion**: `fix/scope-propagation`

### Problem

Scopes from the PAR request are not propagated through the authorization code to the token exchange, causing UserInfo to always return empty `person_info`.

### Root Cause Trace

```
PAR (scope stored) → AuthCode (scope MISSING) → Token (hardcoded 'openid')
→ AccessToken (stored as 'openid') → UserInfo (filters by 'openid' = empty)
```

### Affected Files

| File | Change |
|------|--------|
| `apps/backend/src/core/domain/authorizationCode.ts` | Add `scope: string` field |
| `apps/backend/src/infra/database/schema.ts` | Add `scope` column to `authorization_codes` table |
| `apps/backend/src/core/use-cases/GenerateAuthCode.ts` | Read and store PAR scope in auth code |
| `apps/backend/src/infra/adapters/db/drizzle_authorization_code_repository.ts` | Read/write new `scope` column |
| `apps/backend/src/core/use-cases/token-exchange.ts` | Use `authCode.scope` instead of hardcoded `'openid'` |
| DB migration | Add `scope TEXT NOT NULL DEFAULT 'openid'` to `authorization_codes` |

### Acceptance Criteria

1. `AuthorizationCode` interface MUST include a `scope: string` field.
2. `authorization_codes` DB table MUST have a `scope` column.
3. `GenerateAuthCode` MUST read `parRequest.payload.scope` and store it in the auth code.
4. `TokenExchangeUseCase` MUST use `authCode.scope` for both ID Token generation and access token storage (NOT hardcoded `'openid'`).
5. Given a PAR with `scope="openid uinfin name email"`, the resulting access token MUST store `scope="openid uinfin name email"`.

### Tasks

- [ ] T01 Add `scope: string` to `AuthorizationCode` interface in `authorizationCode.ts`.
- [ ] T02 Add `scope: text('scope').notNull()` column to `authorization_codes` in `schema.ts`.
- [ ] T03 Generate DB migration for the new column.
- [ ] T04 Update `DrizzleAuthorizationCodeRepository` to read/write the `scope` field.
- [ ] T05 In `GenerateAuthCode`, read `parRequest.payload.scope` and include it when creating the auth code.
- [ ] T06 In `token-exchange.ts`, replace `scope: 'openid'` (line ~97) with `authCode.scope`.
- [ ] T07 In `token-exchange.ts`, use `authCode.scope` when saving the access token (line ~108).
- [ ] T08 Add integration test: PAR with `scope="openid uinfin name"` → token exchange → access token has scope `"openid uinfin name"`.
- [ ] T09 Add integration test: UserInfo with propagated scopes returns correct `person_info` fields.

---

## SPEC-F14: Extend UserInfo Scope Handling & `person_info` Fields

**Finding**: #15 (🔴 Critical — depends on SPEC-F13)  
**Branch Suggestion**: `fix/userinfo-scope-handling`  
**Depends On**: SPEC-F13 (scope propagation must be fixed first)

### Problem

Even after scope propagation is fixed, the `PersonInfo` interface and `UserData` are incomplete. The `mobileno` scope is not handled. The `user.identity` scope is not handled for the ID Token `sub_attributes`.

### Scope → UserInfo `person_info` Claims Matrix

| Scope | `person_info` Field | Value Format | DB Source |
|-------|---------------------|--------------|-----------|
| `uinfin` | `person_info.uinfin` | `{ value: "S1234567A" }` | `users.nric` |
| `name` | `person_info.name` | `{ value: "JOHN DOE" }` | `users.name` |
| `email` | `person_info.email` | `{ value: "john@example.com" }` | `users.email` |
| `mobileno` | `person_info.mobileno` | `{ value: "91234567" }` | `users.mobileno` (**new**) |

### Scope → ID Token `sub_attributes` Claims Matrix

| Scope | `sub_attributes` Field | DB Source |
|-------|----------------------|-----------|
| `user.identity` | `identity_number` | `users.nric` |
| `user.identity` | `identity_coi` | Hardcode `"SG"` |
| `user.identity` | `account_type` | Hardcode `"standard"` |
| `name` | `name` | `users.name` |
| `email` | `email` | `users.email` |
| `mobileno` | `mobileno` | `users.mobileno` |

### Affected Files

| File | Change |
|------|--------|
| `apps/backend/src/infra/database/schema.ts` | Add `mobileno` column to `users` table |
| `apps/backend/src/core/domain/userinfo_claims.ts` | Add `mobileno` to `PersonInfo`, `UserData` interfaces; add scope handling |
| `apps/backend/src/infra/adapters/db/drizzle_userinfo_repository.ts` | Map `mobileno` column |
| `apps/backend/src/core/utils/crypto.ts` | Add `sub_attributes` type definition to `IDTokenClaims` |
| `apps/backend/src/core/application/services/token.service.ts` | Build `sub_attributes` from scopes during ID Token generation |
| `apps/backend/tests/core/claims_filtering.test.ts` | Add tests for all scope-to-claim mappings |

### Acceptance Criteria

1. `PersonInfo` interface MUST include `mobileno?: PersonInfoField`.
2. `UserData` interface MUST include `mobileno: string`.
3. `users` DB table MUST have a `mobileno` column.
4. `mapUserInfoClaims()` MUST handle the `mobileno` scope.
5. Given `scope="openid uinfin name email mobileno"`, UserInfo MUST return all 4 fields in `person_info`.
6. Given `scope="openid"` only, UserInfo MUST return empty `person_info: {}`.
7. ID Token MUST include `sub_attributes` based on scopes per the matrix above (depends on SPEC-F05).

### Expected UserInfo Response (scope: `openid uinfin name email`)

```json
{
  "sub": "7c9c72ec-5be2-495a-a78e-61e809a2a236",
  "iss": "https://vibe-auth.example.com",
  "aud": "test-client",
  "iat": 1710400000,
  "person_info": {
    "uinfin": { "value": "S1234567A" },
    "name": { "value": "JOHN DOE" },
    "email": { "value": "john@example.com" }
  }
}
```

### Tasks

- [ ] T01 Add `mobileno` column to `users` table in `schema.ts`.
- [ ] T02 Generate DB migration for `mobileno`.
- [ ] T03 Add `mobileno` to `PersonInfo` and `UserData` interfaces in `userinfo_claims.ts`.
- [ ] T04 Add `mobileno` scope handling in `mapUserInfoClaims()`.
- [ ] T05 Update `DrizzleUserInfoRepository.getUserById()` to map `mobileno`.
- [ ] T06 Add unit tests for each scope combination in `claims_filtering.test.ts`:
  - `openid` only → empty `person_info`
  - `openid uinfin` → only `uinfin` present
  - `openid name` → only `name` present
  - `openid email` → only `email` present
  - `openid mobileno` → only `mobileno` present
  - `openid uinfin name email mobileno` → all 4 present
- [ ] T07 Add `sub_attributes` builder function for ID Token scope handling (coordinate with SPEC-F05 T07).

---

## Dependency Graph

```
SPEC-F01 (JWKS Security)          → Independent, do first
SPEC-F06 (Token Expiry)           → Independent
SPEC-F09 (Mock Client Enc Key)    → Independent
SPEC-F11 (Error Types)            → Independent
SPEC-F12 (Route Cleanup)          → Independent

SPEC-F02 (PAR auth_context)       → Independent
SPEC-F03 (PAR redirect_uri)       → Independent
SPEC-F07 (WWW-Authenticate)       → Independent

SPEC-F08 (DPoP Consolidation)     → Independent, but test carefully

SPEC-F13 (Scope Propagation)      → BLOCKS SPEC-F14
SPEC-F14 (UserInfo Scope Fields)  → Depends on SPEC-F13
SPEC-F05 (ID Token Claims)        → Partially depends on SPEC-F13 (for sub_attributes scopes)
SPEC-F04 (Auth Error Redirect)    → Low priority, independent

SPEC-F10 (Registry Consistency)   → Low priority, independent
```

### Recommended Execution Order

| Phase | Specs | Rationale |
|-------|-------|-----------|
| **Phase 1: Critical Security** | F01, F08 | Fix potential key leak + consolidate security layer |
| **Phase 2: Critical Pipeline** | F13 → F14 | Fix scope propagation (biggest functional bug) |
| **Phase 3: Compliance** | F05, F06, F07 | Add missing claims + fix token TTL + headers |
| **Phase 4: Validation** | F02, F03, F09 | PAR validation gaps + mock client fix |
| **Phase 5: Cleanup** | F04, F10, F11, F12 | Lower-priority code quality + spec compliance |
