# Contract: Token Exchange API

## Endpoint: `POST /token`

Exchanges an `authorization_code` for tokens.

### Headers

| Name | Mandatory | Value | Description |
|---|---|---|---|
| `Content-Type` | Yes | `application/x-www-form-urlencoded` | Standard form body. |
| `DPoP` | Yes | `JWT (JWS Compact)` | Mandatory DPoP proof. |

### Request Body

| Parameter | Mandatory | Value | Description |
|---|---|---|---|
| `grant_type` | Yes | `authorization_code` | Fixed value. |
| `code` | Yes | `string` | The authorization code. |
| `redirect_uri` | Yes | `string` | Must match the URI used in the PAR phase. |
| `code_verifier` | Yes | `string` | PKCE verifier for the challenge. |
| `client_assertion_type` | Yes | `urn:ietf:params:oauth:client-assertion-type:jwt-bearer` | Fixed value. |
| `client_assertion` | Yes | `JWT (JWS Compact)` | Signed client authentication assertion. |

### Successful Response

**HTTP 200 OK**
**Content-Type**: `application/json`

```json
{
  "access_token": "string (opaque)",
  "id_token": "string (JWE Compact)",
  "token_type": "DPoP",
  "expires_in": 1800
}
```

### Error Responses

| HTTP Status | Error Code | Description |
|---|---|---|---|
| 400 | `invalid_request` | Missing or malformed parameters. |
| 400 | `invalid_grant` | Code is invalid, expired, or used. |
| 401 | `invalid_client` | Client assertion validation failed. |
| 400 | `invalid_dpop_proof` | DPoP header validation failed. |
| 400 | `unsupported_grant_type` | `grant_type` is not `authorization_code`. |

### Security Invariants
1. **DPoP Binding**: The `access_token` returned MUST be bound to the JWK thumbprint of the DPoP proof.
2. **One-Time Use**: The `code` MUST be invalidated immediately upon use. If a code is presented twice, all tokens associated with the session MUST be revoked.
3. **Encryption**: `id_token` MUST be encrypted (JWE) using the client's public encryption key if PII is included.
