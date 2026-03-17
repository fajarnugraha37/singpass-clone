# Contract: Pushed Authorization Endpoint (PAR)

**Endpoint**: `POST /api/par`

## Request
Headers:
- `DPoP`: JWS proof.
- `Content-Type`: `application/x-www-form-urlencoded`

Body:
- `response_type`: `code`
- `client_id`: string
- `redirect_uri`: URL
- `scope`: `openid`
- `state`: string (min 30 chars)
- `nonce`: string (min 30 chars)
- `code_challenge`: string
- `code_challenge_method`: `S256`
- `client_assertion_type`: `urn:ietf:params:oauth:client-assertion-type:jwt-bearer`
- `client_assertion`: JWT
- `dpop_jkt`: string (Optional, thumbprint of DPoP public key)
- `authentication_context_type`: enum (Optional)
- `authentication_context_message`: string (Optional)
- `redirect_uri_https_type`: string (Optional)
- `app_launch_url`: URL (Optional)

## Response
### 201 Created
Headers:
- `DPoP-Nonce`: A fresh nonce for subsequent requests.

Body:
- `request_uri`: `urn:ietf:params:oauth:request_uri:UUID`
- `expires_in`: 60 (integer, seconds)

### 401 Unauthorized
Headers:
- `WWW-Authenticate`: `DPoP error="use_dpop_nonce"`, if the server requires a fresh nonce.
- `DPoP-Nonce`: The required nonce.
