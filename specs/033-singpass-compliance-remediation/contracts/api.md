# API Contract Updates: Singpass Compliance Remediation

## 1. Pushed Authorization Request (PAR)
**Endpoint**: `POST /api/par`

### Request Body (New Parameter)
| Parameter | Type | Mandatory | Description |
|-----------|------|-----------|-------------|
| purpose | string | Yes | The business purpose for data access. |

### Response Headers (New Header)
| Header | Description |
|--------|-------------|
| DPoP-Nonce | **NEW**: A server-signed nonce for DPoP proof freshness. |

## 2. Token Exchange
**Endpoint**: `POST /api/token`

### Response Headers (New Header)
| Header | Description |
|--------|-------------|
| DPoP-Nonce | **NEW**: A fresh server-signed nonce for subsequent requests. |

## 3. Auth Session API (Internal)
**Endpoint**: `GET /api/auth/session`

### Response Body (New Property)
| Property | Type | Description |
|----------|------|-------------|
| purpose | string | **NEW**: The business purpose for the current authorization. |

## 4. UserInfo (Singpass v5 / OIDC)
**Endpoint**: `GET /api/userinfo` or `POST /api/userinfo`

### Response (JWT Payload)
| Claim | Type | Description |
|-------|------|-------------|
| sub | string | **MIGRATED**: Persistent UUID (formerly NRIC). |
| person_info | object | **ENHANCED**: Flat map of attributes with mandatory metadata. |

### Attribute Object Structure
```json
{
  "value": "...",
  "source": "1",
  "classification": "C",
  "lastupdated": "2024-03-18"
}
```
