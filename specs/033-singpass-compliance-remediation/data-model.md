# Data Model: Singpass Compliance Remediation

## Remediated Entities

### PushedAuthorizationRequest (PAR)
Updated to support **Purpose Limitation**.

| Field | Type | Description |
|-------|------|-------------|
| requestUri | string | The unique identifier for the pushed request. |
| clientId | string | The ID of the requesting client. |
| purpose | string | **NEW**: The business purpose for the data access, displayed to the user. |
| dpopJkt | string | The thumbprint of the DPoP public key bound to this request. |
| payload | object | The original authorization request parameters. |
| expiresAt | Date | When the PAR expires. |

### AuthSession
Updated to propagate **Purpose** to the frontend.

| Field | Type | Description |
|-------|------|-------------|
| id | string | UUID session identifier (stored in cookie). |
| parRequestUri | string | Reference to the original PAR. |
| userId | string | **MIGRATED**: Now stores the user's persistent UUID (not NRIC). |
| purpose | string | **NEW**: The purpose string retrieved from the PAR. |
| status | string | Current state of the authentication flow. |
| loa | number | Level of Assurance (1 or 2). |

### MyinfoPerson
Enhanced with **Standard Metadata** for all attributes.

| Field | Type | Description |
|-------|------|-------------|
| [attribute] | object | Each attribute (e.g., name, sex) is an object containing metadata. |
| [attribute].value | any | The actual value of the attribute. |
| [attribute].source | string | **ENHANCED**: Source code ("1" for Gov, "4" for User). |
| [attribute].classification | string | **ENHANCED**: Data classification (default "C"). |
| [attribute].lastupdated | string | **ENHANCED**: ISO 8601 date of last update. |

## State Transitions

1. **PAR Initiation**: Client sends `purpose` → `par_requests` (purpose stored).
2. **Auth Initiation**: `InitiateAuthSession` retrieves `purpose` from PAR → `auth_sessions` (purpose stored).
3. **Login UI**: Frontend calls `GET /api/auth/session` → Displays `purpose`.
4. **Token Generation**: `ValidateLogin` sets `session.userId = user.id` (UUID) → `sub` claim in ID Token uses UUID.
