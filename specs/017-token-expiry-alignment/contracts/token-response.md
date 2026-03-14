# API Contract: Token Response

This contract specifies the token response structure from the `/token` endpoint.

## Endpoint: `POST /token`

### Response Body (200 OK)
The response follows the OIDC and FAPI 2.0 specifications.

```json
{
  "access_token": "eyJhbGci...[truncated]",
  "token_type": "DPoP",
  "expires_in": 1800,
  "id_token": "eyJhbGci...[truncated]",
  "refresh_token": "eyJhbGci...[truncated]"
}
```

### Key Changes
- **`expires_in`**: Now defaults to `1800` (30 minutes) to match Singpass specifications. Previously was `3600`.
- **Configurability**: This value is derived from `sharedConfig.SECURITY.ACCESS_TOKEN_LIFESPAN`.
