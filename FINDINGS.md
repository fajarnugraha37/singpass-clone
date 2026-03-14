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

## Priority Summary

| Priority | Finding | Description |
|----------|---------|-------------|
| 🔴 Critical | #14 | Scope propagation broken — UserInfo always returns empty `person_info` |
| 🔴 Critical | #1 | JWKS may expose private key component `d` |
| 🟠 High | #5 | ID Token missing `acr`, `amr`, `sub_attributes` claims |
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

1. **Fix scope propagation** (#14): Add `scope` field to `AuthorizationCode` domain type. Propagate PAR's `payload.scope` through auth code → token exchange → access token storage.

2. **Audit JWKS export** (#1): Verify that `jose.exportJWK(privateKey)` strips the `d` parameter. If not, extract only public key components before returning.

3. **Add `acr`/`amr` to ID Token** (#5): Track authentication factors during the login flow. After 2FA completion, set `acr: 'urn:singpass:authentication:loa:2'` and `amr: ['pwd', 'otp-sms']`.

4. **Consolidate DPoP validation** (#9): Merge the three DPoP validators into one canonical implementation in `core/utils/dpop_validator.ts` and remove the other two.

5. **Validate `redirect_uri` in PAR** (#3): Call `cryptoService.validateRedirectUri()` in `RegisterParUseCase`.

6. **Add `authentication_context_type` to PAR schema** (#2): Make it optional in Zod schema, validate when client type is Login.

7. **Fix `expires_in`** (#6): Align access token lifetime with Singpass documentation (30 minutes / 1800 seconds).

8. **Add `WWW-Authenticate` headers** (#8): Ensure all 401 responses from UserInfo include the `WWW-Authenticate: DPoP error="..."` header.
