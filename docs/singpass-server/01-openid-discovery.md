# Server Implementation: OpenID Discovery & JWKS

## Overview
The Singpass Identity Provider must host a `.well-known` discovery endpoint to allow relying parties (clients) to dynamically discover the endpoints and cryptographic capabilities required for FAPI 2.0 integration. It must also expose a JWKS endpoint for its public keys.

## Endpoints

### 1. OpenID Discovery (`GET /.well-known/openid-configuration`)
Must return a JSON object with the following crucial properties:
- `issuer`: The identifier of the authorization server.
- `authorization_endpoint`: URL for the authorization endpoint (e.g. `/auth`).
- `token_endpoint`: URL for the token endpoint (e.g. `/token`).
- `userinfo_endpoint`: URL for the userinfo endpoint (e.g. `/userinfo`).
- `jwks_uri`: URL for the JSON Web Key Set (e.g. `/.well-known/keys`).
- `pushed_authorization_request_endpoint`: URL for the PAR endpoint (e.g. `/par`).
- `response_types_supported`: Must include `["code"]` (FAPI 2.0 mandate).
- `grant_types_supported`: Must include `["authorization_code"]`.
- `token_endpoint_auth_methods_supported`: Must include `["private_key_jwt"]`.
- `code_challenge_methods_supported`: Must include `["S256"]`.

### 2. JWKS Endpoint (`GET /.well-known/keys`)
Must expose the public keys used to sign the ID tokens and UserInfo responses. 
- Keys must use `ES256` (or another supported curve like P-256).
- The JSON response must have a `keys` array containing JWK objects with `kid`, `kty` (e.g., `"EC"`), `crv` (e.g., `"P-256"`), `x`, and `y` coordinates.
