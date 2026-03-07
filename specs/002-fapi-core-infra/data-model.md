# Data Model: FAPI 2.0 Database Schema and Core Utilities

This document defines the SQLite database schemas using Drizzle ORM conventions.

## Entities

### `users`
Represents the subject being authenticated (the human user).

| Field | Type | Constraint | Description |
|-------|------|------------|-------------|
| `id` | `uuid` | PK | Unique user identifier. |
| `nric` | `text` | Unique | National ID for the user. |
| `name` | `text` | NOT NULL | Full name of the user. |
| `email` | `text` | Unique | Primary email address. |
| `created_at` | `timestamp` | Default: now() | Registration timestamp. |

### `sessions`
Tracks an active authentication journey and resulting state.

| Field | Type | Constraint | Description |
|-------|------|------------|-------------|
| `id` | `uuid` | PK | Unique session identifier. |
| `user_id` | `uuid` | FK -> `users.id` | The authenticated user (nullable initially). |
| `dpop_jkt` | `text` | - | Thumbprint of the DPoP public key (bound to session). |
| `loa` | `integer` | Default: 0 | Level of Assurance (0: Unauth, 1: Password, 2: 2FA). |
| `is_authenticated` | `boolean` | Default: false | Whether the primary authentication is complete. |
| `expires_at` | `timestamp` | NOT NULL | Session expiry timestamp. |

### `par_requests`
Stores initial authorization parameters pushed by the client.

| Field | Type | Constraint | Description |
|-------|------|------------|-------------|
| `id` | `integer` | PK | Sequential integer for the URN. |
| `request_uri` | `text` | Unique | Generated URI: `urn:ietf:params:oauth:request_uri:<id>`. |
| `payload` | `json` | NOT NULL | Raw authorization parameters (scope, client_id, etc.). |
| `expires_at` | `timestamp` | NOT NULL | Short TTL (typically 60s). |

### `auth_codes`
One-time code issued after user consent, bound to a PAR and Session.

| Field | Type | Constraint | Description |
|-------|------|------------|-------------|
| `id` | `uuid` | PK | Unique identifier. |
| `code` | `text` | Unique | Secure random string (the auth code). |
| `session_id` | `uuid` | FK -> `sessions.id` | Linked user session. |
| `par_id` | `integer` | FK -> `par_requests.id`| Linked PAR request. |
| `code_challenge` | `text` | NOT NULL | PKCE challenge. |
| `code_challenge_method`| `text` | Default: 'S256' | PKCE method. |
| `dpop_jkt` | `text` | NOT NULL | DPoP binding for token exchange. |
| `expires_at` | `timestamp` | NOT NULL | Code expiry (short TTL). |

### `server_keys`
Stores encrypted private keys used for signing JWTs and ID tokens.

| Field | Type | Constraint | Description |
|-------|------|------------|-------------|
| `id` | `uuid` | PK | Key identifier. |
| `encrypted_key` | `text` | NOT NULL | Base64 encoded encrypted private key. |
| `iv` | `text` | NOT NULL | Base64 encoded initialization vector. |
| `auth_tag` | `text` | NOT NULL | Base64 encoded authentication tag (GCM). |
| `is_active` | `boolean` | Default: true | Only active keys are used for signing. |
| `created_at` | `timestamp` | Default: now() | Key creation timestamp. |

### `security_audit_log`
Persistent audit trail for security-critical events.

| Field | Type | Constraint | Description |
|-------|------|------------|-------------|
| `id` | `uuid` | PK | Unique event identifier. |
| `event_type` | `text` | NOT NULL | Type (e.g., CLIENT_AUTH_FAIL, PAR_CREATED, DPOP_REPLAY). |
| `severity` | `text` | NOT NULL | INFO, WARN, ERROR. |
| `details` | `json` | - | Non-sensitive context (client_id, request_uri, error_reason). |
| `client_id` | `text` | - | The client involved in the event. |
| `ip_address` | `text` | - | IP address of the requester. |
| `created_at` | `timestamp` | Default: now() | Event timestamp. |

## Relationships

- A `User` has many `Sessions`.
- A `Session` can result in many `AuthorizationCodes`.
- An `AuthorizationCode` belongs to exactly one `Session` and one `PushedAuthorizationRequest`.
- `SecurityAuditLog` entries are independent but may reference `client_id` or `session_id`.
