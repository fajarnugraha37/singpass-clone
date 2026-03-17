# Contract: JWKS Endpoint

- **Endpoint**: `/jwks`
- **Method**: `GET`
- **Description**: Exposes the server's public keys as a JSON Web Key Set (JWKS).

## Response Body (application/json)

The `keys` array in the JSON response will be updated to include at least one key with `"use": "enc"`.

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
