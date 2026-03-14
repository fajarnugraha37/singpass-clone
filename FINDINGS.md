# FINDINGS: Code Implementation vs. docs/singpass Alignment Audit

**Audit Date**: 2026-03-14  
**Scope**: `apps/backend`, `apps/frontend`, `packages/shared` vs. `docs/singpass`, `docs/singpass-server`, `docs/singpass-client`

> [!NOTE]
> This audit compares the current vibe-auth codebase against the Singpass FAPI 2.0 documentation stored in `docs/singpass/`, `docs/singpass-server/`, and `docs/singpass-client/`. Findings are categorized by endpoint/flow.

---

## Summary

| Area | Status | Details |
|------|--------|---------|
| OpenID Discovery | ✅ Aligned | All required fields present |
| JWKS Endpoint | ✅ Aligned | ES256 keys with `kid`, `kty`, `crv`, `x`, `y` |
| PAR Endpoint | ⚠️ Partially Aligned | Missing `authentication_context_type` validation |
| Authorization Endpoint | ✅ Aligned | Correctly validates `client_id` + `request_uri` |
| Auth Flow (Login + 2FA) | ✅ Aligned | Session-backed, multi-step |
| Auth Code Generation | ✅ Aligned | Ties code to PKCE, DPoP, nonce, user |
| Token Endpoint | ⚠️ Partially Aligned | Missing `acr`/`amr` claims in ID Token |
| UserInfo Endpoint | ⚠️ Partially Aligned | Missing `WWW-Authenticate` header on some errors |
| DPoP Validation | ⚠️ Partially Aligned | `htu` check relaxed in `dpop.ts` |
| ID Token Crypto (JWS/JWE) | ✅ Aligned | ES256 signing + ECDH-ES+A256KW / A256GCM encryption |
| UserInfo Crypto (JWS/JWE) | ✅ Aligned | Same JWS-in-JWE scheme |
| Client Authentication | ✅ Aligned | private_key_jwt with signature verification |
| PKCE | ✅ Aligned | S256-only enforcement |
| Error Handling | ⚠️ Partially Aligned | Some error codes missing per spec |
| Client Registry | ⚠️ Not Production-Ready | Hardcoded mock; `mock-client-id` missing enc key |

---

## Detailed Findings

### 1. OpenID Discovery (`GET /.well-known/openid-configuration`)

**Doc Reference**: `docs/singpass-server/01-openid-discovery.md`  
**Implementation**: `apps/backend/src/infra/http/controllers/discovery.controller.ts`

| Field | Doc Requirement | Code | Status |
|-------|----------------|------|--------|
| `issuer` | ✔ Required | ✔ Dynamic from request URL | ✅ |
| `authorization_endpoint` | ✔ Required | ✔ `${baseUrl}/api/auth` | ✅ |
| `token_endpoint` | ✔ Required | ✔ `${baseUrl}/api/token` | ✅ |
| `userinfo_endpoint` | ✔ Required | ✔ `${baseUrl}/api/userinfo` | ✅ |
| `jwks_uri` | ✔ Required | ✔ `${baseUrl}/.well-known/keys` | ✅ |
| `pushed_authorization_request_endpoint` | ✔ Required | ✔ `${baseUrl}/api/par` | ✅ |
| `response_types_supported` | `["code"]` | `["code"]` | ✅ |
| `grant_types_supported` | `["authorization_code"]` | `["authorization_code"]` | ✅ |
| `token_endpoint_auth_methods_supported` | `["private_key_jwt"]` | `["private_key_jwt"]` | ✅ |
| `code_challenge_methods_supported` | `["S256"]` | `["S256"]` | ✅ |

**Additional fields in code** (not strictly required by doc, but good practice):
- `subject_types_supported: ["public"]` ✅
- `id_token_signing_alg_values_supported: ["ES256"]` ✅
- `dpop_signing_alg_values_supported: ["ES256"]` ✅

> Discovery endpoint is **fully aligned**. No action needed.

---

### 2. JWKS Endpoint (`GET /.well-known/keys`)

**Doc Reference**: `docs/singpass-server/01-openid-discovery.md` (Section 2)  
**Implementation**: `apps/backend/src/infra/http/controllers/jwks.controller.ts`, `apps/backend/src/infra/adapters/jose_crypto.ts` (getPublicJWKS)

| Requirement | Status | Notes |
|-------------|--------|-------|
| Uses ES256 / P-256 | ✅ | Algorithm is `ES256` via `JoseCryptoService` |
| Returns `keys` array with JWK objects | ✅ | `getPublicJWKS()` exports keys correctly |
| Includes `kid`, `kty`, `crv`, `x`, `y` | ⚠️ | `kty` and `crv` are implicitly exported by `jose.exportJWK()`, but `crv` is NOT explicitly guaranteed in the output for all key types. Need to verify at runtime. |
| Keys marked with `use: 'sig'` | ✅ | Explicitly set  |
| Keys marked with `alg: 'ES256'` | ✅ | Explicitly set |

> **FINDING #1**: The `getPublicJWKS()` method derives the public key from the private key via `jose.exportJWK(privateKey)`. This may inadvertently include the private key component `d` in the exported JWK if the key was imported as extractable. This is a **critical security concern** that needs runtime verification.

---

### 3. PAR Endpoint (`POST /par`)

**Doc Reference**: `docs/singpass-server/02-pushed-authorization-request.md`, `docs/singpass/technical-specifications/integration-guide/1.-authorization-request.md`  
**Implementation**: `apps/backend/src/infra/http/controllers/par.controller.ts`, `apps/backend/src/core/use-cases/register-par.ts`, `packages/shared/src/config.ts` (parRequestSchema)

#### Validation Checklist

| Requirement | Status | Notes |
|-------------|--------|-------|
| `client_assertion_type` = `jwt-bearer` | ✅ | Validated by Zod schema |
| `client_assertion` signature verification | ✅ | Via `cryptoService.validateClientAssertion()` |
| `response_type` = `code` | ✅ | Zod literal validation |
| `scope` includes `openid` | ✅ | Zod refine validation |
| `client_id` present | ✅ | Zod `min(1)` |
| `redirect_uri` valid URL | ✅ | Zod `.url()` |
| `state` present | ✅ | Zod `min(1)` |
| `nonce` present | ✅ | Zod `min(1)` |
| `code_challenge` present | ✅ | Zod `min(1)` |
| `code_challenge_method` = `S256` | ✅ | Zod literal |
| DPoP header OR `dpop_jkt` | ✅ | Handled in use case |
| `authentication_context_type` | ❌ **Missing** | Not in schema, not validated |
| `redirect_uri` matches registered URIs | ❌ **Missing** | Not validated in PAR use case |
| **JTI replay protection** | ✅ | `isJtiConsumed` / `consumeJti` |
| Response: `201` with `request_uri` + `expires_in` | ✅ | Correct |

> **FINDING #2**: `authentication_context_type` is **mandatory for Login apps** per the Singpass spec (`docs/singpass/technical-specifications/integration-guide/1.-authorization-request.md`). It is not present in the `parRequestSchema` and is never validated. This field should be at minimum optional in the Zod schema and validated when the client is a Login app.

> **FINDING #3**: `redirect_uri` is validated as a URL by Zod but is **NOT checked against the client's pre-registered redirect URIs** in the PAR use case. The `CryptoService` has a `validateRedirectUri()` method but it's never called during PAR registration. Per the doc: "redirect_uri must match a pre-registered URI for the client."

---

### 4. Authorization Endpoint (`GET /auth`)

**Doc Reference**: `docs/singpass-server/03-authorization-endpoint.md`  
**Implementation**: `apps/backend/src/infra/http/controllers/auth.controller.ts`, `apps/backend/src/core/use-cases/InitiateAuthSession.ts`

| Requirement | Status | Notes |
|-------------|--------|-------|
| Accept `client_id` + `request_uri` only | ✅ | Validated via `initiateAuthRequestSchema` |
| Retrieve PAR data by `request_uri` | ✅ | `parRepository.getByRequestUri()` |
| Validate `request_uri` not expired | ✅ | Checked via repository (only returns non-expired) |
| Validate `client_id` matches PAR | ✅ | Explicit check in use case |
| Start secure session (cookie-backed) | ✅ | `setCookie('vibe_auth_session', ...)` with `httpOnly`, `secure`, `sameSite: 'Lax'` |
| Render login UI | ✅ | Redirects to `/login` (Astro frontend) |
| Error → redirect back with error params | ✅ | Redirects to `/error` page |

> Authorization endpoint initiation is **well-aligned**. Session management follows best practices.

> One deviation: on error, the implementation redirects to an internal `/error` page rather than the client's `redirect_uri` with error params as specified in the OIDC spec. This is acceptable for the IdP-side implementation since we're the authorization server, not a relying party.

---

### 5. Auth Flow (Login + 2FA + Auth Code Generation)

**Doc Reference**: `docs/singpass-server/03-authorization-endpoint.md` (Steps 4-7)  
**Implementation**: `apps/backend/src/core/use-cases/ValidateLogin.ts`, `Validate2FA.ts`, `GenerateAuthCode.ts`

| Requirement | Status | Notes |
|-------------|--------|-------|
| Username/password authentication | ✅ | Mock credentials (`S1234567A` / `password123`) |
| 2FA via OTP | ✅ | Generated 6-digit OTP, validated |
| Auth code tied to: userId, clientId, codeChallenge, dpopJkt, nonce | ✅ | All fields populated from PAR + session |
| Auth code expiration (60 seconds) | ✅ | `new Date(Date.now() + 60000)` |
| Redirect with `code` and `state` | ✅ | Constructed correctly |
| Error → redirect with error params | ⚠️ | Errors thrown as exceptions, not redirected to `redirect_uri` |

> **FINDING #4**: Per the OIDC spec (Section 3.1.2.6), when user authentication fails, the server should redirect back to the `redirect_uri` with error parameters (e.g., `error=access_denied&state=abc`). Currently, the 2FA use case returns JSON error responses directly rather than constructing a redirect URL with error params. This is partially acceptable since the frontend Svelte app handles the JSON response, but a pure OIDC-compliant redirect-based error flow is not implemented.

---

### 6. Token Endpoint (`POST /token`)

**Doc Reference**: `docs/singpass-server/04-token-endpoint.md`, `docs/singpass/technical-specifications/integration-guide/3.-token-exchange.md`  
**Implementation**: `apps/backend/src/infra/http/controllers/token.controller.ts`, `apps/backend/src/core/use-cases/token-exchange.ts`, `apps/backend/src/core/application/services/token.service.ts`

#### Request Validation

| Requirement | Status | Notes |
|-------------|--------|-------|
| `DPoP` header mandatory | ✅ | Explicit check, throws `invalid_dpop_proof` |
| `client_assertion_type` = `jwt-bearer` | ✅ | Zod literal |
| `client_assertion` signature verification | ✅ | `clientAuthService.authenticate()` |
| `grant_type` = `authorization_code` | ✅ | Zod literal + use case check |
| `code` validity + not expired + not used | ✅ | `authCodeRepository.getByCode()` |
| `redirect_uri` matches PAR phase | ✅ | Explicit check against `authCode.redirectUri` |
| PKCE `code_verifier` validation | ✅ | `validatePKCE()` with SHA-256 S256 |
| DPoP `jkt` matches stored `dpopJkt` | ✅ | Explicit binding check |
| Mark code as one-time use | ✅ | `authCodeRepository.markAsUsed()` |

#### Token Response

| Requirement | Status | Notes |
|-------------|--------|-------|
| `access_token` (opaque) | ✅ | Random 32-byte base64url string |
| `id_token` (JWE Compact) | ✅ | Nested JWS-in-JWE |
| `token_type` = `DPoP` | ✅ | Hardcoded |
| `expires_in` | ✅ | 3600 seconds (code says 3600, doc says 1800) |
| `refresh_token` (optional) | ✅ | Generated |

#### ID Token Claims

| Claim | Doc Requirement | Code | Status |
|-------|----------------|------|--------|
| `sub` (UUID) | ✔ Required | ✔ `userId` | ✅ |
| `aud` (client_id) | ✔ Required | ✔ `clientId` | ✅ |
| `iss` | ✔ Required | ✔ `issuer` | ✅ |
| `iat` | ✔ Required | ✔ `Math.floor(Date.now() / 1000)` | ✅ |
| `exp` | ✔ Required | ✔ `now + expiresIn` | ✅ |
| `nonce` | ✔ Required | ✔ From auth code | ✅ |
| `acr` | ✔ Required (e.g., `urn:singpass:authentication:loa:2`) | ❌ **Missing** | ❌ |
| `amr` | ✔ Required (e.g., `["pwd", "otp-sms"]`) | ❌ **Missing** | ❌ |
| `sub_attributes` | ✔ Conditional (if `user.identity` scope) | ❌ **Missing** | ❌ |

> **FINDING #5**: The ID Token is **missing critical FAPI 2.0 / Singpass claims**: `acr`, `amr`, and conditional `sub_attributes`. Per `docs/singpass-server/04-token-endpoint.md`: ID Token must include `acr` (e.g., `urn:singpass:authentication:loa:2`), `amr` (e.g., `["pwd", "otp-sms"]`), and conditionally `sub_attributes`. The `IDTokenClaims` interface in `crypto.ts` defines `acr` and `amr` but they are never populated.

> **FINDING #6**: `expires_in` in the token response is `3600` (1 hour), but the Singpass doc says `access_token` has a lifetime of **30 minutes** (1800 seconds). The server doc example uses `1800`. This is a discrepancy.

> **FINDING #7**: The `scope` stored with the access token is hardcoded as `'openid'` in `token-exchange.ts:97`. The comment itself acknowledges this: "This should come from the original request or auth code." The actual requested scopes from the PAR phase are not propagated through the auth code to the token generation.

---

### 7. UserInfo Endpoint (`GET /userinfo`)

**Doc Reference**: `docs/singpass-server/05-userinfo-endpoint.md`, `docs/singpass/technical-specifications/integration-guide/5.-requesting-for-userinfo.md`  
**Implementation**: `apps/backend/src/infra/http/controllers/userinfo.controller.ts`, `apps/backend/src/core/use-cases/get-userinfo.ts`

#### Request Validation

| Requirement | Status | Notes |
|-------------|--------|-------|
| `Authorization: DPoP <access_token>` | ✅ | Checked, extracted |
| `DPoP` header present | ✅ | Explicit check |
| DPoP proof validation (signature, `htm`, `htu`, `jti`) | ✅ | Full validation via `DPoPValidator` |
| DPoP `jkt` matches `access_token.cnf.jkt` | ✅ | `expectedJkt: tokenData.dpopJkt` |
| Access token validity + expiration | ✅ | Checked |
| Supports both GET and POST | ✅ | Both mounted in routes |

#### Response

| Requirement | Status | Notes |
|-------------|--------|-------|
| `Content-Type: application/jwt` | ✅ | Explicitly set |
| Body is JWE Compact string | ✅ | `signAndEncrypt()` returns compact JWE |
| JWS signed with server ES256 key | ✅ | Via `cryptoService.signAndEncrypt()` |
| JWE encrypted with client's public enc key | ✅ | Client enc key fetched from registry/cache |
| `person_info` structure with `{ value: ... }` fields | ✅ | `mapUserInfoClaims()` returns correct structure |
| Standard claims: `sub`, `iss`, `aud`, `iat` | ✅ | All present in `mapUserInfoClaims()` |

#### Error Handling

| Requirement | Status | Notes |
|-------------|--------|-------|
| `invalid_token` → 401 | ✅ | Handled |
| `invalid_dpop_proof` → 401 | ✅ | Handled |
| `WWW-Authenticate` header on errors | ⚠️ | Only set for `invalid_request` (auth header), not consistently for `invalid_token` or `invalid_dpop_proof` |
| `server_error` → 500 | ✅ | Catch-all handler |

> **FINDING #8**: Per the Singpass spec: "These parameters will also be returned in the `WWW-Authenticate` header if the `error` is `invalid_request`, `invalid_token`, or `invalid_dpop_proof`." The implementation only sets `WWW-Authenticate` for the missing Authorization header case, but omits it for `invalid_token` and some `invalid_dpop_proof` error paths.

---

### 8. DPoP Validation

**Doc Reference**: Multiple server docs reference DPoP validation.  
**Implementation**: `core/utils/dpop.ts`, `core/utils/dpop_validator.ts`, `infra/adapters/jose_crypto.ts`

> **FINDING #9**: There are **three separate DPoP validation implementations**:
> 1. `core/utils/dpop.ts` → `validateDPoPProof()` — Used by token exchange
> 2. `core/utils/dpop_validator.ts` → `DPoPValidator.validate()` — Used by userinfo
> 3. `infra/adapters/jose_crypto.ts` → `CryptoService.validateDPoPProof()` — Used by PAR
>
> This violates DRY principle and creates inconsistencies:
> - `dpop.ts` (L52-56): **`htu` check is commented out / relaxed** — the validation continues even if `htu` doesn't match
> - `dpop_validator.ts`: `htu` check is **strict** (enforced)
> - `jose_crypto.ts`: `htu` check is **strict** (enforced)
> - `dpop.ts`: JTI replay protection is **NOT performed** (no JTI store access)
> - `dpop_validator.ts` and `jose_crypto.ts`: JTI replay protection **IS performed**

| DPoP Check | `dpop.ts` | `dpop_validator.ts` | `jose_crypto.ts` |
|------------|-----------|---------------------|-------------------|
| `typ = dpop+jwt` | ✅ | ✅ | ✅ (implicit via jwtVerify) |
| JWK in header | ✅ | ✅ | ✅ |
| Signature verify | ✅ | ✅ | ✅ |
| `htm` match | ✅ | ✅ | ✅ |
| `htu` match | ❌ Relaxed | ✅ | ✅ |
| `iat` freshness | ✅ | ✅ | ✅ |
| `jti` presence | ✅ | ✅ | ✅ |
| `jti` replay check | ❌ No | ✅ | ✅ |
| `jkt` binding | ✅ | ✅ | ✅ |

---

### 9. JWS/JWE Cryptography

**Doc Reference**: Server docs for Token and UserInfo endpoints.  
**Implementation**: `core/utils/crypto.ts`, `infra/adapters/jose_crypto.ts`

| Requirement | Status | Notes |
|-------------|--------|-------|
| Sign with ES256 server private key | ✅ | `SignJWT` with `alg: 'ES256'` |
| Encrypt with `ECDH-ES+A256KW` (key wrap) | ✅ | Default in both `crypto.ts` and `jose_crypto.ts` |
| Encrypt with `A256GCM` (content encryption) | ✅ | Default in both |
| Nested JWT: JWS first, then JWE | ✅ | `signIDToken()` → `encryptIDToken()` |
| Same scheme for both ID Token and UserInfo | ✅ | Both use `signAndEncrypt()` |

> Cryptographic implementation is **well-aligned** with FAPI 2.0 / Singpass requirements.

---

### 10. Client Registry & JWKS Management

**Doc Reference**: Multiple docs reference client public keys.  
**Implementation**: `apps/backend/src/infra/adapters/client_registry.ts`

> **FINDING #10**: The `mock-client-id` client only has a **signature key** (`use: 'sig'`), but **no encryption key** (`use: 'enc'`). The token endpoint will fail with `"Client public encryption key not found"` when generating the ID Token for this client. Only `test-client` has both sig and enc keys.

> **FINDING #11**: The client registry uses two patterns: a `class DrizzleClientRegistry` (async, implements port) and a bare `function getClientConfig()` (sync, direct access). Some code paths use the class, others use the function. This creates an inconsistency where the PAR use case and token service bypass the hexagonal architecture port by directly calling `getClientConfig()`.

---

### 11. PKCE Implementation

**Doc Reference**: `docs/singpass/technical-specifications/integration-guide/1.-authorization-request.md`  
**Implementation**: `apps/backend/src/core/utils/pkce.ts`

| Requirement | Status | Notes |
|-------------|--------|-------|
| S256-only method | ✅ | Rejects non-S256 |
| SHA-256 hash of verifier | ✅ | `crypto.subtle.digest('SHA-256', ...)` |
| base64url encoding | ✅ | Manual replacement of `+`, `/`, `=` |

> PKCE validation is **correctly aligned**.

---

### 12. Error Response Formats

**Doc Reference**: All endpoint docs specify standard OAuth 2.0 error formats.  
**Implementation**: `apps/backend/src/infra/middleware/fapi-error.ts`, `packages/shared/src/tokens.ts`

| Error Code | Doc Specifies | Code Covers | Status |
|------------|--------------|-------------|--------|
| `invalid_request` | ✅ | ✅ | ✅ |
| `invalid_client` | ✅ | ✅ | ✅ |
| `invalid_grant` | ✅ | ✅ | ✅ |
| `unauthorized_client` | ✅ | ✅ | ✅ |
| `unsupported_grant_type` | ✅ | ✅ | ✅ |
| `invalid_scope` | ✅ | ✅ | ✅ |
| `invalid_dpop_proof` | ✅ | ✅ | ✅ |
| `invalid_token` (UserInfo) | ✅ | ⚠️ Not in `FapiErrors` | ⚠️ |
| `server_error` | ✅ | ⚠️ Handled in global handler, not in `FapiErrors` | ⚠️ |
| `temporarily_unavailable` | ✅ | ❌ Not implemented | ❌ |

> **FINDING #12**: `temporarily_unavailable` and `server_error` error types mentioned in the Singpass spec are not defined in the `FapiErrors` helper or the `tokenErrorResponseSchema`.

---

### 13. Routing Discrepancy

**Implementation**: `apps/backend/src/index.ts`

> **FINDING #13**: Several endpoints are **mounted at duplicate paths**:
> - `/token` is mounted at BOTH `app.post('/token', ...)` (line 107) AND inside `api` route at `/api/token` (line 77)
> - `/userinfo` is mounted at BOTH `app.get('/userinfo', ...)` (lines 108-109) AND inside `api` route AND inside `authRouter`
> - This means the same endpoint handler is accessible at 3+ paths: `/userinfo`, `/api/userinfo`, `/auth/userinfo`, `/api/auth/userinfo`
>
> While functionally acceptable, this creates confusion and increases the attack surface. The discovery document advertises `/api/token` and `/api/userinfo`, so the root-level duplicates are unnecessary.

---

### 14. Scope Propagation (Critical Bug)

> **FINDING #14 (Cross-Cutting Issue)**: Scopes requested during PAR are **not propagated** through the authentication flow:
> 1. PAR stores `payload.scope` ✅
> 2. Auth code does NOT store the scope ❌
> 3. Token exchange hardcodes scope as `'openid'` ❌ (see `token-exchange.ts:97`)
> 4. Access token is stored with `scope: 'openid'` ❌
> 5. UserInfo `mapUserInfoClaims()` filters by scopes from `tokenData.scope` → always `'openid'`
> 6. As a result, `person_info` returned by UserInfo will always be **empty** (no `uinfin`, `name`, or `email`)
>
> This is a **functional bug**: even if a client requests `openid uinfin name email`, the UserInfo endpoint will never return those fields because the scope chain is broken.

---

### 15. Scope Handling & UserInfo Scope-to-Claims Matrix

**Doc References**:
- `docs/singpass/technical-specifications/integration-guide/1.-authorization-request.md` (Scope parameter definition)
- `docs/singpass/technical-specifications/integration-guide/4.-parsing-the-id-token.md` (ID Token claims & `sub_attributes`)
- `docs/singpass/technical-specifications/integration-guide/5.-requesting-for-userinfo.md` (UserInfo `person_info`)
- `docs/singpass-server/05-userinfo-endpoint.md` (Server-side `person_info` structure)

**Implementation Files**:
- `packages/shared/src/config.ts` → `parRequestSchema` (scope validation at PAR entry)
- `apps/backend/src/core/domain/par.types.ts` → `PushedAuthorizationRequest` (PAR storage)
- `apps/backend/src/core/use-cases/GenerateAuthCode.ts` → Auth code generation
- `apps/backend/src/core/domain/authorizationCode.ts` → `AuthorizationCode` type
- `apps/backend/src/core/use-cases/token-exchange.ts` → Token exchange
- `apps/backend/src/core/application/services/token.service.ts` → ID Token generation
- `apps/backend/src/core/domain/userinfo_claims.ts` → `mapUserInfoClaims()` + `PersonInfo`
- `apps/backend/src/core/use-cases/get-userinfo.ts` → UserInfo use case
- `apps/backend/src/infra/database/schema.ts` → DB schema

#### 15a. Singpass Scope Definitions (from docs)

Per the Singpass spec, the following scopes are supported:

| Scope | Type | Description | Where Data is Returned |
|-------|------|-------------|----------------------|
| `openid` | **Mandatory** | Required by OIDC spec. Must always be present. | Enables the OIDC flow itself |
| `user.identity` | Login | Returns `identity_number`, `identity_coi`, `account_type` | ID Token → `sub_attributes` |
| `name` | Login | Returns user's principal name | ID Token → `sub_attributes.name` |
| `email` | Login | Returns user's email address | ID Token → `sub_attributes.email` |
| `mobileno` | Login | Returns user's Singapore mobile number | ID Token → `sub_attributes.mobileno` |
| `sub_account` | Login | Returns sub-account information | ID Token → `sub_account` |
| `uinfin` | Myinfo | Returns NRIC/FIN identifier | UserInfo → `person_info.uinfin` |
| _(Myinfo data catalog scopes)_ | Myinfo | Various personal data (employment, income, etc.) | UserInfo → `person_info.*` |

#### 15b. Scope → Claims Matrix

This matrix defines which claims should be returned for each scope, and where (ID Token vs UserInfo `person_info`):

##### ID Token Claims (based on scopes)

| Scope Requested | ID Token Claim | Value Format | Doc Reference |
|----------------|----------------|--------------|---------------|
| _(always)_ | `sub` | UUID string | Always returned |
| _(always)_ | `aud` | client_id string | Always returned |
| _(always)_ | `iss` | Issuer URL | Always returned |
| _(always)_ | `iat` | Unix timestamp (seconds) | Always returned |
| _(always)_ | `exp` | Unix timestamp (seconds) | Always returned |
| _(always)_ | `nonce` | String from PAR request | Always returned |
| _(always)_ | `acr` | `urn:singpass:authentication:loa:{1,2,3}` | Always returned |
| _(always)_ | `amr` | `["pwd"]`, `["pwd", "otp-sms"]`, etc. | Always returned |
| _(always)_ | `sub_type` | `"user"` | Always returned |
| `user.identity` | `sub_attributes.identity_number` | NRIC/FIN/Foreign ID string | Conditional |
| `user.identity` | `sub_attributes.identity_coi` | 2-letter country code (e.g. `"SG"`) | Conditional |
| `user.identity` | `sub_attributes.account_type` | `"standard"` or `"foreign"` | Conditional |
| `name` | `sub_attributes.name` | User's full name string | Conditional |
| `email` | `sub_attributes.email` | Email string | Conditional |
| `mobileno` | `sub_attributes.mobileno` | SG mobile number string | Conditional |

##### UserInfo `person_info` Claims (based on scopes — Myinfo apps)

| Scope Requested | `person_info` Field | Value Format | Doc Reference |
|----------------|---------------------|--------------|---------------|
| `uinfin` | `person_info.uinfin` | `{ "value": "S1234567A" }` | `docs/singpass-server/05-userinfo-endpoint.md` |
| `name` | `person_info.name` | `{ "value": "JOHN DOE" }` | `docs/singpass-server/05-userinfo-endpoint.md` |
| `email` | `person_info.email` | `{ "value": "john@example.com" }` | `docs/singpass-server/05-userinfo-endpoint.md` |
| _(Myinfo catalog)_ | `person_info.*` | `{ "value": "..." }` per field | Follows Myinfo Get Person API |

> Standard claims always returned in UserInfo: `sub`, `iss`, `aud`, `iat`

#### 15c. Code Implementation Gap Analysis

##### Current `PersonInfo` Interface (`userinfo_claims.ts`)

```typescript
// CURRENT CODE
export interface PersonInfo {
  uinfin?: PersonInfoField;   // ✅ Exists
  name?: PersonInfoField;     // ✅ Exists
  email?: PersonInfoField;    // ✅ Exists
  // ❌ MISSING: mobileno, dob, sex, race, nationality, birthcountry,
  //            residentialstatus, passtype, employment, etc. (Myinfo fields)
}
```

**Gap**: `PersonInfo` only has 3 fields. Real Singpass/Myinfo can have 100+ fields. For MVP this is acceptable, but additional Myinfo catalog fields are missing.

##### Current `mapUserInfoClaims()` (`userinfo_claims.ts`)

```typescript
// CURRENT CODE
export function mapUserInfoClaims(user, clientId, issuer, scopes) {
  const person_info = {};
  const scopeSet = new Set(scopes);

  if (scopeSet.has('uinfin'))  person_info.uinfin = { value: user.nric };
  if (scopeSet.has('name'))    person_info.name   = { value: user.name };
  if (scopeSet.has('email'))   person_info.email  = { value: user.email };

  return { sub: user.id, iss: issuer, aud: clientId, iat: ..., person_info };
}
```

**Issue**: The scope filtering logic ITSELF is correct. The problem is the `scopes` parameter always receives `['openid']` due to the broken propagation chain (Finding #14).

##### Current `UserData` Interface (`userinfo_claims.ts`)

```typescript
// CURRENT CODE
export interface UserData {
  id: string;
  nric: string;
  name: string;
  email: string;
  // ❌ MISSING: mobileno (needed for 'mobileno' scope)
}
```

##### Current DB User Schema (`infra/database/schema.ts`)

```typescript
// CURRENT CODE
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  nric: text('nric').unique(),
  name: text('name').notNull(),
  email: text('email').unique(),
  createdAt: integer('created_at', ...),
  // ❌ MISSING: mobileno column
});
```

#### 15d. Scope Propagation Chain — Full Code Trace

Below is the complete trace of how scopes flow (or fail to flow) through the system:

```
Step 1: PAR Request
  ┌─────────────────────────────────────────────────────────┐
  │ Client sends: scope="openid uinfin name email"          │
  │ File: packages/shared/src/config.ts (parRequestSchema)  │
  │ Zod validates: scope must include 'openid'       ✅     │
  │ Stored in: parRequests.payload.scope             ✅     │
  └─────────────────────────────────────────────────────────┘
                           │
                           ▼
Step 2: Auth Session Initiation
  ┌─────────────────────────────────────────────────────────┐
  │ File: core/use-cases/InitiateAuthSession.ts             │
  │ PAR data is referenced via session.parRequestUri  ✅    │
  │ Scopes NOT explicitly copied to session           ⚠️   │
  │ (they're still accessible via parRequest.payload)       │
  └─────────────────────────────────────────────────────────┘
                           │
                           ▼
Step 3: Login & 2FA (scopes not relevant here)
                           │
                           ▼
Step 4: Auth Code Generation  ← 🔴 FIRST BREAK POINT
  ┌─────────────────────────────────────────────────────────┐
  │ File: core/use-cases/GenerateAuthCode.ts                │
  │ Reads: parRequest.payload (which HAS scope)       ✅   │
  │ Creates AuthorizationCode with:                         │
  │   - code, userId, clientId, codeChallenge         ✅   │
  │   - dpopJkt, nonce, redirectUri                   ✅   │
  │   - scope                                         ❌   │
  │                                                         │
  │ AuthorizationCode interface (authorizationCode.ts):      │
  │   → DOES NOT have a 'scope' field                 ❌   │
  │                                                         │
  │ DB schema (authorization_codes table):                   │
  │   → DOES NOT have a 'scope' column                ❌   │
  └─────────────────────────────────────────────────────────┘
                           │
                           ▼
Step 5: Token Exchange  ← 🔴 SECOND BREAK POINT
  ┌─────────────────────────────────────────────────────────┐
  │ File: core/use-cases/token-exchange.ts                  │
  │ Retrieves authCode — no scope field available     ❌   │
  │ Line 97: scope: 'openid' ← HARDCODED             ❌   │
  │   // Comment says: "This should come from the           │
  │   //   original request or auth code"                   │
  │ Passes hardcoded scope to:                              │
  │   - tokenService.generateTokens() (for ID Token)       │
  │   - tokenRepository.saveAccessToken()                   │
  └─────────────────────────────────────────────────────────┘
                           │
                           ▼
Step 6: Access Token Storage  ← 🔴 THIRD BREAK POINT
  ┌─────────────────────────────────────────────────────────┐
  │ File: core/use-cases/token-exchange.ts (line 108)       │
  │ Saved to DB with: scope: 'openid'                 ❌   │
  │ DB column (access_tokens.scope): stores 'openid'  ❌   │
  └─────────────────────────────────────────────────────────┘
                           │
                           ▼
Step 7: UserInfo Request  ← 🔴 CONSEQUENCE
  ┌─────────────────────────────────────────────────────────┐
  │ File: core/use-cases/get-userinfo.ts                    │
  │ Reads tokenData.scope = 'openid'                  ❌   │
  │ Passes scopes=['openid'] to mapUserInfoClaims()         │
  │                                                         │
  │ File: core/domain/userinfo_claims.ts                    │
  │ scopeSet = Set(['openid'])                              │
  │ Has 'uinfin'? NO → skip                            ❌  │
  │ Has 'name'?   NO → skip                            ❌  │
  │ Has 'email'?  NO → skip                            ❌  │
  │                                                         │
  │ RESULT: person_info = {} (EMPTY OBJECT)             ❌  │
  └─────────────────────────────────────────────────────────┘
```

#### 15e. What Needs to Change (Fix Matrix)

| # | File | Change Required | Priority |
|---|------|----------------|----------|
| 1 | `core/domain/authorizationCode.ts` | Add `scope: string` field to `AuthorizationCode` interface | 🔴 Critical |
| 2 | `infra/database/schema.ts` | Add `scope` column to `authorization_codes` table | 🔴 Critical |
| 3 | `core/use-cases/GenerateAuthCode.ts` | Read `parRequest.payload.scope` and store it in the auth code | 🔴 Critical |
| 4 | `infra/adapters/db/drizzle_authorization_code_repository.ts` | Read/write the new `scope` column | 🔴 Critical |
| 5 | `core/use-cases/token-exchange.ts` | Replace hardcoded `'openid'` with `authCode.scope` on line 97 and line 108 | 🔴 Critical |
| 6 | `core/domain/userinfo_claims.ts` | Add `mobileno` to `PersonInfo` interface; add `mobileno` to `UserData` | 🟡 Medium |
| 7 | `infra/database/schema.ts` | Add `mobileno` column to `users` table | 🟡 Medium |
| 8 | `core/domain/userinfo_claims.ts` | Add `mobileno` scope handling in `mapUserInfoClaims()` | 🟡 Medium |
| 9 | `core/application/services/token.service.ts` | Pass scopes to ID token generator; add `sub_attributes` and `sub_type` based on scopes | 🟠 High |
| 10 | `core/utils/crypto.ts` | Extend `IDTokenClaims` interface with `sub_type`, `sub_attributes` | 🟠 High |

#### 15f. Expected Behavior After Fix

Given a PAR request with `scope="openid uinfin name email"`:

**ID Token should contain:**
```json
{
  "sub": "7c9c72ec-5be2-495a-a78e-61e809a2a236",
  "aud": "test-client",
  "iss": "https://vibe-auth.example.com",
  "iat": 1710400000,
  "exp": 1710403600,
  "nonce": "abc123",
  "acr": "urn:singpass:authentication:loa:2",
  "amr": ["pwd", "otp-sms"],
  "sub_type": "user",
  "sub_attributes": {
    "name": "JOHN DOE"
  }
}
```

**UserInfo response (after JWE decryption + JWS verification) should contain:**
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

**Currently returns (broken):**
```json
{
  "sub": "7c9c72ec-...",
  "iss": "https://vibe-auth.example.com",
  "aud": "test-client",
  "iat": 1710400000,
  "person_info": {}
}
```

#### 15g. Scope Handling in ID Token vs UserInfo — Decision Matrix

This matrix helps AI agents determine WHERE each scope's data should be returned:

| Scope | Returned in ID Token `sub_attributes`? | Returned in UserInfo `person_info`? | Notes |
|-------|---------------------------------------|-------------------------------------|-------|
| `openid` | N/A (enables the flow) | N/A (enables the flow) | Must always be present |
| `user.identity` | ✅ Yes → `identity_number`, `identity_coi`, `account_type` | ❌ No | Login apps only |
| `name` | ✅ Yes → `sub_attributes.name` | ✅ Yes → `person_info.name` | Both for Login, `person_info` for Myinfo |
| `email` | ✅ Yes → `sub_attributes.email` | ✅ Yes → `person_info.email` | Both for Login, `person_info` for Myinfo |
| `mobileno` | ✅ Yes → `sub_attributes.mobileno` | ✅ Yes → `person_info.mobileno` | Both for Login, `person_info` for Myinfo |
| `uinfin` | ❌ No | ✅ Yes → `person_info.uinfin` | Myinfo apps only |
| _(Myinfo catalog scopes)_ | ❌ No | ✅ Yes → `person_info.*` | Myinfo apps only |

> **Key Rule**: Login apps get user identity data primarily from the **ID Token** (`sub_attributes`). Myinfo apps get detailed personal data from the **UserInfo endpoint** (`person_info`). Some scopes like `name`, `email`, `mobileno` appear in BOTH.

---

## Priority Summary

| Priority | Finding | Description |
|----------|---------|-------------|
| 🔴 Critical | #14 | Scope propagation broken — UserInfo always returns empty `person_info` |
| 🔴 Critical | #15 | Scope handling is non-functional end-to-end (detailed trace above) |
| 🔴 Critical | #1 | JWKS may expose private key component `d` |
| 🟠 High | #5 | ID Token missing `acr`, `amr`, `sub_type`, `sub_attributes` claims |
| 🟠 High | #9 | Three inconsistent DPoP validators; `dpop.ts` has relaxed `htu` and no JTI replay check |
| 🟠 High | #3 | PAR doesn't validate `redirect_uri` against registered URIs |
| 🟡 Medium | #2 | `authentication_context_type` not validated |
| 🟡 Medium | #6 | `expires_in` mismatch (3600 vs doc's 1800) |
| 🟡 Medium | #8 | Missing `WWW-Authenticate` headers on UserInfo errors |
| 🟡 Medium | #10 | `mock-client-id` missing encryption key |
| 🟡 Medium | #13 | Duplicate route mounting |
| 🟢 Low | #4 | Auth errors not redirected per OIDC spec |
| 🟢 Low | #7 | Hardcoded scope in token exchange (same root cause as #14) |
| 🟢 Low | #11 | Inconsistent client registry access pattern |
| 🟢 Low | #12 | Missing `temporarily_unavailable` error type |

---

## Recommendations

1. **Fix scope propagation** (#14, #15): Add `scope` field to `AuthorizationCode` domain type and DB schema. Propagate PAR's `payload.scope` through auth code → token exchange → access token storage. See the 10-step fix matrix in Finding #15e.

2. **Audit JWKS export** (#1): Verify that `jose.exportJWK(privateKey)` strips the `d` parameter. If not, extract only public key components before returning.

3. **Add `acr`/`amr`/`sub_type`/`sub_attributes` to ID Token** (#5): Track authentication factors during the login flow. After 2FA completion, set `acr: 'urn:singpass:authentication:loa:2'`, `amr: ['pwd', 'otp-sms']`, `sub_type: 'user'`. Populate `sub_attributes` based on scopes per the matrix in Finding #15g.

4. **Consolidate DPoP validation** (#9): Merge the three DPoP validators into one canonical implementation in `core/utils/dpop_validator.ts` and remove the other two.

5. **Validate `redirect_uri` in PAR** (#3): Call `cryptoService.validateRedirectUri()` in `RegisterParUseCase`.

6. **Add `authentication_context_type` to PAR schema** (#2): Make it optional in Zod schema, validate when client type is Login.

7. **Fix `expires_in`** (#6): Align access token lifetime with Singpass documentation (30 minutes / 1800 seconds).

8. **Add `WWW-Authenticate` headers** (#8): Ensure all 401 responses from UserInfo include the `WWW-Authenticate: DPoP error="..."` header.

9. **Extend `UserData` and DB schema** (#15): Add `mobileno` to `UserData` interface and `users` DB table. Add `mobileno` to `PersonInfo` interface and `mapUserInfoClaims()` scope handling.
