# Client Implementation: Pushed Authorization Request (PAR)

## Overview
To initiate a Singpass login under FAPI 2.0, the client (Relying Party) MUST first send a Pushed Authorization Request (PAR) from its backend. It does NOT redirect the user's browser with the full payload.

## Steps to Execute

### 1. Prepare Cryptographic Materials
- **Client Assertion**: Generate a JSON Web Token (JWT) signed by your client's registered Private Key (RS256/ES256). 
  - Claims must include `iss` (your client ID), `sub` (your client ID), `aud` (Singpass token/par endpoint), `iat`, `exp`, and `jti`.
- **PKCE**: Generate a random `code_verifier`. Calculate the `code_challenge` by SHA-256 hashing the verifier and encoding it in Base64URL format. Keep the `code_verifier` safe in your session storage.
- **DPoP Key Pair**: Generate a transient or persistent ECDSA (ES256) or RSA key pair. This will be used to sign DPoP proofs. Calculate its JWK Thumbprint (`dpop_jkt`).

### 2. Formulate the PAR Payload
Build an `application/x-www-form-urlencoded` payload containing:
- `client_id`
- `response_type=code`
- `scope=openid user.identity` (Add required scopes)
- `redirect_uri` (Must be registered)
- `state` (Random session-bound string)
- `nonce` (Random session-bound string)
- `code_challenge` and `code_challenge_method=S256`
- `client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer`
- `client_assertion` (The signed JWT)
- `authentication_context_type` (e.g., `APP_AUTHENTICATION_DEFAULT`)

You must either include `dpop_jkt` in the payload OR send a signed `DPoP` header in the HTTP request.

### 3. Send the Request
Send a `POST` request to the Singpass `pushed_authorization_request_endpoint` (e.g., `/par`).

### 4. Handle Response
If successful, the server returns:
```json
{
  "request_uri": "urn:ietf:params:oauth:request_uri:xxxxx",
  "expires_in": 60
}
```
Store the `state`, `nonce`, and `code_verifier` in your backend user session, tied to the login attempt. Proceed to redirect the browser.