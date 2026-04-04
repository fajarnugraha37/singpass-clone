# Phase 1: Data Model

## Drizzle ORM Schema Extensions (`apps/backend/src/adapters/database/schema.ts`)

### Table: `developers` (Identity & Access Management)
| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | UUID/String | Primary Key | `primaryKey()` |
| `email` | String | Developer Email | `notNull(), unique()` |
| `role` | Enum | `developer` or `admin` | `notNull(), default('developer')` |
| `status` | Enum | `active` or `deactivated` | `notNull(), default('active')` |
| `created_at` | Timestamp | Creation Date | `defaultNow()` |
| `updated_at` | Timestamp | Last Updated | `defaultNow()` |

*Note*: Passwords are not stored. Authentication relies on email OTPs.

### Table: `otp_codes` (Temporary Auth Tokens)
| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | UUID | Primary Key | `primaryKey()` |
| `email` | String | Associated Email | `notNull()` |
| `code` | String | OTP String | `notNull()` |
| `expires_at`| Timestamp | Expiration Time | `notNull()` |
| `used` | Boolean | Has it been used | `notNull(), default(false)` |

### Table: `email_log` (Audit log for Mock Emails)
| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | UUID | Primary Key | `primaryKey()` |
| `recipient` | String | To Email | `notNull()` |
| `subject` | String | Subject Line | `notNull()` |
| `body` | Text | Content/OTP | `notNull()` |
| `sent_at` | Timestamp | Sent Date | `defaultNow()` |

### Table: `oidc_clients` (Client Registry)
| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `client_id` | String | OIDC Client ID | `primaryKey()` |
| `developer_id`| UUID | Owner Reference | `references(() => developers.id)` |
| `client_secret`| String | Hashed Secret | `notNull()` |
| `client_name` | String | Display Name | `notNull()` |
| `redirect_uris`| JSON | Array of allowed URIs | `notNull()` |
| `jwks_uri` | String | Optional JWKS endpoint | `nullable()` |
| `allowed_scopes`| JSON | Array of scopes | `notNull()` |
| `grant_types` | JSON | E.g. `authorization_code` | `notNull()` |
| `status` | Enum | `active` or `inactive` | `notNull(), default('active')` |
| `deleted_at` | Timestamp | Soft Delete Flag | `nullable()` |
| `created_at` | Timestamp | Creation Date | `defaultNow()` |

### Table: `singpass_sandbox_users`
| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `nric` | String | ID Document Number | `primaryKey()` |
| `password` | String | Hashed Sandbox Password | `notNull()` |
| `myinfo_payload`| JSON | Generated Identity Data | `notNull()` |
| `status` | Enum | `active` or `deactivated` | `notNull(), default('active')` |

### Table: `sessions` (OIDC/FAPI Token Observability)
| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `session_id` | String | Unique Session ID | `primaryKey()` |
| `client_id` | String | Client Reference | `references(() => oidc_clients.client_id)` |
| `user_sub` | String | Sandbox User Reference | `references(() => singpass_sandbox_users.nric)` |
| `scopes` | JSON | Granted Scopes | `notNull()` |
| `expires_at` | Timestamp | Expiration Time | `notNull()` |
| `created_at` | Timestamp | Issued At Time | `defaultNow()` |

## State Transitions & Rules

1. **Client Rotation**: When a developer rotates a client secret in `oidc_clients`, the existing `client_secret` is immediately overwritten with the hashed new secret.
2. **Soft Deletion**: Setting `deleted_at` on an `oidc_clients` record triggers immediate deletion of all records in `sessions` matching `client_id`.
3. **Cursor Pagination**: Admin lists order by `(created_at DESC, id DESC)`. The cursor payload encapsulates `[last_created_at, last_id]`.