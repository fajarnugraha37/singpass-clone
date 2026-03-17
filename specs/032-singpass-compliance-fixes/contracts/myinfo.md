# MyInfo Interface: Singpass Compliance Audit Remediation

## GET /api/userinfo (UserInfo/MyInfo Endpoint)

Updated to provide full metadata per attribute and enforce DPoP nonce.

### Headers

| Header | Value | Required | Description |
|--------|-------|----------|-------------|
| Authorization | Bearer [AccessToken] | YES | Standard OIDC auth. |
| DPoP | string | **YES** | DPoP proof of the key bound to the access token. MUST include a fresh server nonce. |

### Response (200 OK - JWE Encrypted)

Decrypted payload contains the `person_info` object.

#### Attribute Mapping Example
Each attribute now includes `source`, `classification`, and `lastupdated`.

```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "person_info": {
    "name": {
      "value": "TAN CHEN CHEN",
      "source": "1",
      "classification": "C",
      "lastupdated": "2024-03-18"
    },
    "uinfin": {
      "value": "S1234567A",
      "source": "1",
      "classification": "C",
      "lastupdated": "2024-03-18"
    }
  }
}
```

**Attribute Meta Definition**:
- `value`: [Actual data value]
- `source`: "1" (Government-verified), "2" (Client-provided), "3" (Not applicable), "4" (User-provided).
- `classification`: "C" (Confidential).
- `lastupdated`: Date string (YYYY-MM-DD).
