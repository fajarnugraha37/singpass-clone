# Auth Interface: Singpass Compliance Audit Remediation

## POST /api/par (Pushed Authorization Endpoint)

Updated to include the mandatory `purpose` parameter and DPoP nonce enforcement.

### Request Body (application/x-www-form-urlencoded)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| purpose | string | **YES** | **[NEW]** Purpose string for data access, displayed to user on consent page. |
| response_type | string | YES | Must be `code`. |
| ... | ... | ... | ... |

### Headers

| Header | Value | Required | Description |
|--------|-------|----------|-------------|
| DPoP | string | **YES** | DPoP proof of the client's public key. |

### Response (201 Created)

| Field | Type | Description |
|-------|------|-------------|
| request_uri | string | The request identifier. |
| expires_in | integer | Lifetime in seconds. |
| dpop_nonce | string | **[UPDATED]** The server-signed nonce to be used in the next request. |

### Response (401 Unauthorized - DPoP Nonce Mismatch)

When a client provides a missing or invalid nonce in the DPoP proof.

**Headers**:
- `DPoP-Nonce`: [Fresh server-signed nonce]

**Body**:
```json
{
  "error": "use_dpop_nonce",
  "error_description": "Missing or invalid DPoP nonce"
}
```

## POST /api/token (Token Endpoint)

Enforces mandatory DPoP nonce validation.

### Request Body (application/x-www-form-urlencoded)

[Standard OAuth2 / FAPI 2.0 parameters]

### Headers

| Header | Value | Required | Description |
|--------|-------|----------|-------------|
| DPoP | string | **YES** | DPoP proof MUST include the `nonce` claim provided by the server. |

### Response (200 OK)

| Field | Type | Description |
|-------|------|-------------|
| access_token | string | Opaque access token bound to the DPoP key. |
| id_token | string | Signed and encrypted JWT. The `sub` claim MUST be a UUID. |
| dpop_nonce | string | Fresh nonce for subsequent UserInfo requests. |
