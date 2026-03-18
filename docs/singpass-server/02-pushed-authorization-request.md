# Server Implementation: Pushed Authorization Request (PAR)

## Overview
As per FAPI 2.0, clients must use the Pushed Authorization Request (PAR) endpoint instead of passing authorization parameters directly via the browser redirect. 

## Endpoint: `POST /par` (or similar)
Accepts a `application/x-www-form-urlencoded` payload from the client.

### Validation Requirements:
1. **Client Authentication**: 
   - Validate `client_assertion_type` is `urn:ietf:params:oauth:client-assertion-type:jwt-bearer`.
   - Validate `client_assertion` (which is a signed JWT). The server must verify the signature against the client's registered public key (JWKS), and ensure the `aud`, `iss`, `sub`, and `exp` claims are correct.
2. **OIDC Parameters**:
   - `response_type` must be `code`.
   - `scope` must include `openid`. Requested scopes MUST be pre-authorized for the client (checked against `allowedScopes`).
   - `client_id` must match the authenticated client.
   - `redirect_uri` must match a pre-registered URI for the client.
   - `state` and `nonce` must be present.
3. **Safety & Compliance**:
   - **URL Safety**: All `redirect_uri` and `site_url` values MUST use HTTPS and MUST NOT contain IP addresses (e.g., `127.0.0.1`). `localhost` is allowed only in development/mock environments.
   - **Client Status**: The client MUST be active (`isActive: true`). Deactivated clients are blocked from all OIDC transactions.
   - **Entity Association**: Each client MUST be associated with a Unique Entity Number (UEN) and have an accepted service agreement.
4. **PKCE**:
   - `code_challenge` must be present.
   - `code_challenge_method` must be `S256`.
5. **DPoP**:
   - The request must either contain a `DPoP` header (and validate the DPoP proof) OR include `dpop_jkt` in the body.
6. **Singpass Specific**:
   - `authentication_context_type`: Mandatory for Login apps (e.g., `APP_AUTHENTICATION_DEFAULT`).
   - `purpose`: Mandatory for all requests. A string describing the business intent for data access.
   - **Test Account Limit**: Entities (UENs) are limited to a maximum of 5 staging test accounts in production-like environments.

### DPoP Nonce Requirement (FAPI 2.0)
The server MUST provide a `DPoP-Nonce` header in the response. If the client's DPoP proof is missing a nonce or uses an invalid/expired one, the server MUST return a `401 Unauthorized` with the `use_dpop_nonce` error code and a fresh `DPoP-Nonce` header.

### Processing & Storage
- Store the entire valid request payload in a secure database (e.g., SQLite `PushedAuthorizationRequests` table) linked to a newly generated `request_uri`.
- The `purpose` must be stored and displayed to the user on the consent page.
- Set an expiration time (typically 60 seconds).

### Response
Return a `201 Created` JSON response with a `DPoP-Nonce` header:
```json
{
  "request_uri": "urn:ietf:params:oauth:request_uri:1234567890",
  "expires_in": 60
}
```
Header: `DPoP-Nonce: <signed-jwt-nonce>`


### Error Handling
Return standard OIDC error formats (e.g., `invalid_request`, `invalid_client`, `invalid_scope`, `invalid_dpop_proof`) with HTTP 400 or 401 if validation fails.
