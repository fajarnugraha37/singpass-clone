# Data Model: Singpass Compliance Hardening

This feature does not introduce new database tables or change the core data model. The changes are focused on the structure and validation of ephemeral data (JWTs) and public-facing metadata.

## 1. DPoP Proof (JWT)

The following claims will now be strictly validated:

- **`exp` (Expiration Time)**: Must be present. `exp - iat` must be <= 120 seconds.
- **`ath` (Access Token Hash)**: Must be present for Userinfo requests. Its value must be the Base64URL-encoded SHA-256 hash of the access token.

## 2. Client Assertion (JWT)

The following claims will now be strictly validated:

- **`iss` (Issuer)**: Must be identical to the `sub` claim.
- **`sub` (Subject)**: Must be identical to the `iss` claim.
- **`aud` (Audience)**: Must match the Singpass issuer identifier.
- **`exp` (Expiration Time)**: `exp - iat` must be <= 120 seconds.
- **`jti` (JWT ID)**: Will be tracked to prevent replay attacks at the token endpoint.

## 3. JWKS (JSON Web Key Set)

The public JWKS document will be extended to include keys for encryption.

- **`use`**: A key with `use: "enc"` will now be available.

```json
{
  "keys": [
    {
      "use": "sig",
      "kty": "EC",
      "kid": "...",
      "crv": "P-256",
      "alg": "ES256",
      "x": "...",
      "y": "..."
    },
    {
      "use": "enc",
      "kty": "EC",
      "kid": "...",
      "crv": "P-256",
      "alg": "ECDH-ES+A256KW",
      "x": "...",
      "y": "..."
    }
  ]
}
```

## 4. OIDC Discovery Document

The discovery document will be updated to include the following metadata fields, advertising the server's encryption capabilities:

- `id_token_encryption_alg_values_supported`
- `id_token_encryption_enc_values_supported`
- `userinfo_encryption_alg_values_supported`
- `userinfo_encryption_enc_values_supported`

## 5. Token Endpoint Request

The `code_verifier` parameter in the token request body will be validated against the following constraints:

- **Type**: `string`
- **Minimum Length**: 43
- **Maximum Length**: 128
- **Regex**: `^[A-Za-z0-9\-\._~]+$`
