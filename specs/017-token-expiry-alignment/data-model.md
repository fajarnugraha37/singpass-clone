# Data Model: Access Token Expiry Alignment

## Entities

### Security Configuration
Represents the system-wide security settings, including token lifespans.

| Field | Type | Description |
|-------|------|-------------|
| `ACCESS_TOKEN_LIFESPAN` | `number` (seconds) | Duration for which an access token remains valid after issuance. Default: `1800` (30 mins). |

### Access Token (Runtime)
Represents the runtime token object returned by the token service.

| Field | Type | Description |
|-------|------|-------------|
| `access_token` | `string` | The opaque or JWT access token. |
| `expires_in` | `number` (seconds) | Time in seconds until the token expires. Updated to `1800` (from `3600`). |
| `token_type` | `string` | The type of token (e.g., `DPoP`). |
| `id_token` | `string` | The signed/encrypted OIDC ID Token. |
| `refresh_token` | `string` | The refresh token. |

## Persistence Layer (Drizzle/SQLite)
The `access_tokens` table stores the `expiresAt` timestamp calculated during the token exchange flow.

- **`expiresAt`**: `Date` (Unix timestamp in SQLite). Calculated as `IssueDate + (expires_in * 1000)`.
- **Validation**: Queries to protected resources MUST include `WHERE expires_at > CURRENT_TIMESTAMP`.
