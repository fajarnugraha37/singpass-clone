# Contract: GET /userinfo

## Overview
Returns the user's information for the authenticated subject.

## Request
`GET /userinfo`

### Headers
- `Authorization`: `DPoP <access_token>` (REQUIRED)
- `DPoP`: A valid DPoP proof JWT (REQUIRED)

### Query Parameters
None.

## Response

### Success: `200 OK`
- **Content-Type**: `application/jwt` (or `text/plain` for raw JWE)
- **Body**: A compact JWE string.

**Decrypted JWS Payload Structure**:
```json
{
  "sub": "user-uuid",
  "iss": "https://id.singpass.gov.sg",
  "aud": "client-id",
  "iat": 1725194380,
  "person_info": {
    "uinfin": { "value": "S1234567A" },
    "name": { "value": "JOHN DOE" },
    "email": { "value": "john@example.com" }
  }
}
```

### Error: `401 Unauthorized`
- **Content-Type**: `application/json`
- **Headers**: `WWW-Authenticate: DPoP error="invalid_token", error_description="..."`
- **Body**:
```json
{
  "error": "invalid_token",
  "error_description": "The access token is invalid or has expired"
}
```

### Error: `401 Unauthorized` (DPoP Fail)
- **Body**:
```json
{
  "error": "invalid_dpop_proof",
  "error_description": "DPoP htm mismatch"
}
```

## Security
- Access token MUST be DPoP-bound.
- JKT in Access Token MUST match thumbprint of DPoP public key.
- Response MUST be signed with server's private ES256 key.
- Response MUST be encrypted with client's public encryption key.
