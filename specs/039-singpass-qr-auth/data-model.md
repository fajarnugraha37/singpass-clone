# Data Model: Singpass QR Authentication Flow

## Entities

### `QRSessions`
This table tracks the state and lifecycle of a specific QR authentication attempt.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary Key. Unique identifier for the QR session. |
| `state` | String(255) | OIDC `state` parameter generated for the PAR request. |
| `nonce` | String(255) | OIDC `nonce` parameter generated for the PAR request. |
| `request_uri` | String(1024) | The `request_uri` returned by Singpass PAR endpoint. |
| `status` | Enum | Current state of the auth flow. |
| `auth_code` | String(2048) | The authorization code received from Singpass on success. (Null initially) |
| `id_token` | Text | The signed/encrypted ID Token received after token exchange. (Null initially) |
| `expires_at` | DateTime | Timestamp when the QR code/session becomes invalid. |
| `created_at` | DateTime | When the session was initialized. |

**Status Enum Values**:
- `PENDING`: Initial state, waiting for the user to scan the QR code.
- `AUTHORIZED`: User has authorized the login on their phone, and the callback has been received.
- `CANCELLED`: User explicitly cancelled the transaction on their phone.
- `EXPIRED`: The session reached its `expires_at` time without a successful login.
- `ERROR`: An unexpected technical error occurred during the flow.

## State Transitions

1. **`null` → `PENDING`**: Triggered when the user lands on the login page and the PAR request succeeds.
2. **`PENDING` → `AUTHORIZED`**: Triggered when the `/callback` endpoint is called with a matching `state` and a valid `code`.
3. **`PENDING` → `CANCELLED`**: Triggered if the `/callback` receives a `cancel` error from Singpass.
4. **`PENDING` → `EXPIRED`**: Triggered by a background worker or upon a frontend polling request if `now > expires_at`.
5. **`ANY` → `ERROR`**: Triggered if a network error or cryptographic validation failure occurs.

## Validation Rules

- `id`, `state`, `nonce` are mandatory and must be cryptographically secure.
- `request_uri` must be stored to allow the frontend to reconstruct the full authorization URL.
- `status` updates must be atomic to prevent race conditions during polling.
