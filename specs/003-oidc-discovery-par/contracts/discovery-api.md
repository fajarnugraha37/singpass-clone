# HTTP Contract: OIDC Discovery & PAR

## 1. OIDC Discovery Document
**Endpoint**: `GET /.well-known/openid-configuration`
**Response**: `200 OK`
```json
{
  "issuer": "https://<your_domain>",
  "authorization_endpoint": "https://<your_domain>/auth",
  "token_endpoint": "https://<your_domain>/token",
  "userinfo_endpoint": "https://<your_domain>/userinfo",
  "jwks_uri": "https://<your_domain>/.well-known/keys",
  "pushed_authorization_request_endpoint": "https://<your_domain>/par",
  "response_types_supported": ["code"],
  "grant_types_supported": ["authorization_code"],
  "token_endpoint_auth_methods_supported": ["private_key_jwt"],
  "code_challenge_methods_supported": ["S256"]
}
```

## 2. JWKS Endpoint
**Endpoint**: `GET /.well-known/keys`
**Response**: `200 OK`
```json
{
  "keys": [
    {
      "kid": "unique-key-id",
      "kty": "EC",
      "crv": "P-256",
      "x": "...",
      "y": "..."
    }
  ]
}
```

## 3. Pushed Authorization Request (PAR)
**Endpoint**: `POST /par`
**Content-Type**: `application/x-www-form-urlencoded`
**Parameters**:
- `client_assertion_type`: `urn:ietf:params:oauth:client-assertion-type:jwt-bearer` (required)
- `client_assertion`: JWT signed by client (required)
- `response_type`: `code` (required)
- `client_id`: string (required)
- `redirect_uri`: string (required)
- `state`: string (required)
- `nonce`: string (required)
- `code_challenge`: string (required)
- `code_challenge_method`: `S256` (required)
- `authentication_context_type`: string (required for Singpass Login)
- `dpop_jkt`: string (optional if DPoP header is present)
- `scope`: string (required, must include `openid`)

**Headers**:
- `DPoP`: JWT proof of possession (optional if `dpop_jkt` is provided in body)

**Success Response**: `201 Created`
```json
{
  "request_uri": "urn:ietf:params:oauth:request_uri:1234567890abcdef",
  "expires_in": 60
}
```

**Error Response**: `400 Bad Request` or `401 Unauthorized`
```json
{
  "error": "invalid_request",
  "error_description": "Detailed reason for failure"
}
```
