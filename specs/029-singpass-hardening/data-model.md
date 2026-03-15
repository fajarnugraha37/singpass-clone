# Data Model: Singpass Implementation Hardening

## Persistent Entities

### `auth_codes` (Table)
Represents short-lived authorization codes used during the OIDC flow.

| Field | Type | Rules |
|-------|------|-------|
| `code` | text (PK) | Unique secure random string |
| `state` | text | MUST match redirect state |
| `nonce` | text | MUST be included in ID Token |
| `code_challenge` | text | Used for PKCE S256 verification |
| `client_id` | text | Client identifier |
| `redirect_uri` | text | Registered URI (must match exactly) |
| `scope` | text | Authorized scopes (space-separated) |
| `used_at` | integer | Timestamp when code was exchanged (null if unused) |
| `expires_at` | integer | Expiry timestamp |

### `auth_sessions` (Table)
Represents persistent browser sessions linked to OIDC interactions.

| Field | Type | Rules |
|-------|------|-------|
| `id` | text (PK) | Session identifier |
| `user_id` | text (FK) | References `users.id` |
| `request_uri` | text | For PAR flow linking |
| `created_at` | integer | Creation timestamp |
| `expires_at` | integer | Expiry timestamp |

## State Transitions

### Authorization Flow
1. **PAR Request**: Store session state and metadata in `auth_sessions`.
2. **Auth Approval**: Generate `auth_codes` entry.
3. **Token Exchange**:
   - Query `auth_codes` by code.
   - Fail if `used_at` is NOT null (Replay prevention).
   - Verify `code_verifier` against `code_challenge` (PKCE).
   - Set `used_at = now()`.
   - Issue tokens.
