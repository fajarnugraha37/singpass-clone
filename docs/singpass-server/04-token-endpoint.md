# Server Implementation: Token Endpoint (Token Exchange)

## Overview
The Token endpoint is where clients exchange the `authorization_code` for an `id_token` and an `access_token`. This endpoint strictly enforces FAPI 2.0 constraints, including Private Key JWT authentication, PKCE, and DPoP.

## Endpoint: `POST /token` (e.g. `/fapi/token`)
Accepts an `application/x-www-form-urlencoded` payload.

### Request Headers
- `DPoP`: Mandatory DPoP proof JWT.

### Validation Requirements
1. **Client Authentication**:
   - `client_assertion_type` must be `urn:ietf:params:oauth:client-assertion-type:jwt-bearer`.
   - `client_assertion` must be a signed JWT. Verify the signature against the client's public JWK (from static `jwks` or fetched from `jwks_uri`).
2. **Grant Validation**:
   - `grant_type` must be `authorization_code`.
   - `code` must be valid, not expired, and tied to this `client_id`.
   - `redirect_uri` must exactly match the URI used in the PAR phase.
3. **PKCE Validation**:
   - The `code_verifier` provided must hash (using SHA-256 and base64url encoding) exactly to the `code_challenge` stored with the authorization code.
4. **DPoP Validation**:
   - Validate the `DPoP` header proof.
   - Extract the JWK Thumbprint (`jkt`) from the DPoP header.
   - Verify that this `jkt` matches the `dpop_jkt` stored with the authorization code.
   - **Nonce Check**: The DPoP proof MUST contain a `nonce` that matches the expected server-signed nonce. If missing or invalid, return `401 Unauthorized` with `use_dpop_nonce` error and a fresh `DPoP-Nonce` header.

### Token Generation
Upon successful validation:
1. **Access Token**: Generate a secure `access_token` bound to the client's DPoP key. (Set lifetime, e.g., 30 minutes).
2. **ID Token (JWE/JWS)**: Generate an `id_token`.
   - **Claims**: Include `sub` (**MUST be a persistent UUID**, not NRIC), `aud` (client_id), `iss`, `iat`, `exp`, `nonce` (from PAR), `acr` (e.g., `urn:singpass:authentication:loa:2`), `amr` (e.g., `["pwd", "otp-sms"]`), and conditionally `sub_attributes` (if specific scopes like `name` or `user.identity` were requested).
   - **Signing (JWS)**: Sign the ID token payload using the server's `ES256` private key using the `jose` library.
   - **Encryption (JWE)**: Mandatorily encrypt the signed JWS using the Client's public encryption key.
   - **Algorithms**: `ECDH-ES+A256KW` for key wrap and `A256GCM` for content encryption.

### Response
Return a `200 OK` JSON response with `application/json` content type and a fresh `DPoP-Nonce` header:
```json
{
  "access_token": "string (opaque)",
  "id_token": "string (JWE Compact)",
  "token_type": "DPoP",
  "expires_in": 1800,
  "refresh_token": "string (optional)"
}
```
Header: `DPoP-Nonce: <signed-jwt-nonce>`


### Error Handling
Return structured JSON errors (e.g., `invalid_grant`, `invalid_client`, `invalid_dpop_proof`) mapped to HTTP 400 or 401.

## Mock Client Configuration (Development)
For local development and integration testing, a mock client is available with pre-configured keys.

### Client ID: `mock-client-id`
- **Redirect URI**: `http://localhost:3000/callback`
- **JWKS (Public Encryption Key)**:
  - **kid**: `mock-client-enc-key`
  - **use**: `enc`
  - **alg**: `ECDH-ES+A256KW`
  - **kty**: `EC`
  - **crv**: `P-256`
  - **x**: `1HrSJLEHsUI8f3TCMdiFVtDyXOtmJeu0x2b0MT-a1vI`
  - **y**: `cRC2KiCF4oQxfiZ39vVBMp5ng2rPEpYSSmNI7brbTiQ`