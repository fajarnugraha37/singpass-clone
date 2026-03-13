# Research: FAPI 2.0 Token Exchange

## Decision: Technology Stack & Standards

- **JWT/JWE/JWS Library**: `jose`
  - *Rationale*: Native support for JWE, JWS, and DPoP. Lightweight and works perfectly in Bun/Node environments.
- **Client Authentication**: `private_key_jwt`
  - *Rationale*: Required by FAPI 2.0 and Singpass for secure backend-to-backend authentication.
- **Token Binding**: DPoP (RFC 9449)
  - *Rationale*: Mandatory for FAPI 2.0 to prevent token injection and replay attacks.
- **ID Token Encryption (JWE)**: Mandatory for PII.
  - *Algorithms*: `ECDH-ES+A256KW` for key wrap (preferred), `A256GCM` for content encryption.
  - *Key Types*: EC keys (P-256, P-384, P-521).

## Alternatives Considered

- **Library: `jsonwebtoken` + `node-jose`**
  - *Rejection*: `jsonwebtoken` lacks native JWE support. `node-jose` is older and heavier. `jose` is a modern, unified replacement.
- **Authentication: `client_secret_post` / `client_secret_basic`**
  - *Rejection*: Insecure and deprecated in FAPI 2.0 profiles for high-security environments.

## Technical Patterns

### 1. DPoP Validation Pattern
1. Verify `DPoP` header JWT signature using the public key embedded in its `jwk` header.
2. Check `htm` (method) and `htu` (URL) match the current request.
3. Check `iat` and `exp` (skew tolerance < 2 mins).
4. Verify `jti` has not been seen before (replay protection - cache in SQLite/Memory).
5. Extract `jkt` (JWK Thumbprint) and compare with `dpop_jkt` stored in the `AuthorizationCode` entity.

### 2. ID Token JWE/JWS Pattern
1. Create JWS: Sign payload with server's private key (RS256/ES256).
2. Create JWE: Encrypt the signed JWS string using the client's public encryption key.
3. Return the compact JWE string as the `id_token`.

### 3. Code Reuse Protection
- Authorization codes MUST be deleted or marked as used immediately upon lookup.
- If a used code is presented, all tokens associated with that code session MUST be revoked.

## Needs Clarification (Resolved)

- **Q: Encryption algorithms?** -> A: `ECDH-ES+A256KW` for EC keys.
- **Q: ID Token Encryption?** -> A: Mandatory for PII as per Singpass specs.
- **Q: DPoP key reuse?** -> A: Same key must be used for PAR, Token, and Userinfo within one session.
