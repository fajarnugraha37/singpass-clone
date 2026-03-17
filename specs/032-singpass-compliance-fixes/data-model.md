# Data Model: Singpass Compliance Audit Remediation

## Updated Entities

### PushedAuthorizationRequest (Database Table: `par_requests`)

Updated to explicitly store the `purpose` of the request.

| Field | Type | Description |
|-------|------|-------------|
| id | integer | Primary key, auto-increment |
| requestUri | text | Unique identifier for the PAR request (urn:ietf:...) |
| clientId | text | ID of the client making the request |
| purpose | text | **[NEW]** The mandatory purpose string provided by the client |
| dpopJkt | text | Thumbprint of the DPoP key bound to this request |
| payload | json | The full validated PAR request body |
| expiresAt | datetime | Expiration timestamp |

### AuthSession (Database Table: `auth_sessions`)

Updated to store the internal stable identifier (UUID) instead of the NRIC.

| Field | Type | Description |
|-------|------|-------------|
| id | text | Primary key (UUID) |
| userId | text | **[MODIFIED]** Now stores the user's UUID (from `users.id`) instead of NRIC |
| status | text | Current state of the authentication flow |
| ... | ... | ... |

### MyinfoProfile (Database Table: `myinfo_profiles`)

The `data` JSON structure is updated to follow the Singpass MyInfo v5 metadata specification.

#### Attribute Object Structure
Every attribute in the `data` JSON now follows this structure:

```json
{
  "value": "Attribute Value or null",
  "source": "1",
  "classification": "C",
  "lastupdated": "2024-03-18"
}
```

**Metadata Values**:
- `source`: "1" (Government-verified), "2" (Client-provided), "3" (Not applicable), "4" (User-provided).
- `classification`: "C" (Confidential).

## Validation Rules

- **PAR Purpose**: 
    - MUST be present in all PAR requests.
    - MUST be a non-empty string.
    - MUST be persisted in the `par_requests` table.
- **Subject Identifier (sub)**:
    - MUST be a valid UUID.
    - MUST NOT be an NRIC or FIN.
- **DPoP Nonce**:
    - MUST be a server-signed JWT.
    - MUST include `clientId` and `exp` claims.
