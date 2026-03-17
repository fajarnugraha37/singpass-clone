# Contract: Token Endpoint

**Endpoint**: `POST /api/token`

## Request
Headers:
- `DPoP`: JWS proof.
- `Content-Type`: `application/x-www-form-urlencoded`

Body:
- `grant_type`: `authorization_code`
- `code`: string
- `redirect_uri`: URL
- `code_verifier`: PKCE verifier.
- `client_assertion_type`: `urn:ietf:params:oauth:client-assertion-type:jwt-bearer`
- `client_assertion`: JWT

## Response
### 200 OK
Headers:
- `DPoP-Nonce`: A fresh nonce for subsequent requests.

Body:
- `access_token`: string (JWT, DPoP-bound)
- `id_token`: string (JWT)
  - `sub_attributes.account_type`: `standard` | `foreign`
- `token_type`: `DPoP`
- `expires_in`: integer

### 401 Unauthorized
Headers:
- `WWW-Authenticate`: `DPoP error="use_dpop_nonce"`, if the server requires a fresh nonce.
- `DPoP-Nonce`: The required nonce.
