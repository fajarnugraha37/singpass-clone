# Contract: ID Token (Nested JWT)

The ID Token generated for `mock-client-id` must be a nested JWT (Signed then Encrypted).

## ID Token Payload (Signed JWT)
Standard OIDC claims plus Singpass-specific attributes.

- **iss**: Server Issuer URL
- **sub**: User Identifier (e.g., NRIC)
- **aud**: `mock-client-id`
- **iat**: Issuance time
- **exp**: Expiration time
- **acr**: Authentication Context Class Reference (e.g., `vnd.singpass.loa2`)
- **sub_attributes**: Map of user attributes based on scopes (PII)

## Signature (JWS)
- **Algorithm**: `ES256`
- **Typ**: `JWT`

## Encryption (JWE)
The signed JWT is encrypted with the client's public encryption key.

- **Algorithm (alg)**: `ECDH-ES+A256KW` (Key Wrap)
- **Encryption (enc)**: `A256GCM` (Content Encryption)
- **Recipient**: `mock-client-id`
- **Public Key**: From Client Registry (`mock-client-enc-key`)

## Response Body
Standard OIDC Token Response.

```json
{
  "access_token": "...",
  "id_token": "...",
  "token_type": "DPoP",
  "expires_in": 1800,
  "refresh_token": "..."
}
```
`id_token` will be a five-part base64url-encoded string (JWE).
