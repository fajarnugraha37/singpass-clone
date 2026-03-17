# Contract: OIDC Discovery Endpoint

- **Endpoint**: `/.well-known/openid-configuration`
- **Method**: `GET`
- **Description**: Exposes OpenID Connect metadata about the authorization server.

## Response Body (application/json)

The JSON response will be updated to include the following fields:

```json
{
  "...": "...",
  "id_token_encryption_alg_values_supported": [
    "ECDH-ES+A256KW"
  ],
  "id_token_encryption_enc_values_supported": [
    "A256GCM"
  ],
  "userinfo_encryption_alg_values_supported": [
    "ECDH-ES+A256KW"
  ],
  "userinfo_encryption_enc_values_supported": [
    "A256GCM"
  ],
  "...": "..."
}
```
