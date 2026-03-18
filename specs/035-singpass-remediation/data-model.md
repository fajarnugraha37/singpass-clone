# Data Model: Singpass Compliance Remediation

## Domain Entities

### ClientConfig (Updated)

| Field | Type | Description |
|-------|------|-------------|
| `clientId` | `string` | Unique identifier (existing) |
| `clientName` | `string` | Human-readable app name (existing) |
| `appType` | `'Login' \| 'Myinfo'` | Application category (existing) |
| `allowedScopes` | `string[]` | List of authorized scopes for the client |
| `isActive` | `boolean` | Whether the app can perform transactions |
| `uen` | `string` | Unique Entity Number of the owner |
| `siteUrl` | `string?` | Public facing application URL |
| `appDescription` | `string?` | Administrative description of the app |
| `supportEmails` | `string[]?` | Contact list for support issues |
| `hasAcceptedAgreement` | `boolean` | Whether the entity has accepted the service agreement |

## Database Schema (Remediation)

### `clients` Table

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `TEXT` | PRIMARY KEY |
| `name` | `TEXT` | NOT NULL |
| `app_type` | `TEXT` | NOT NULL ('Login' or 'Myinfo') |
| `uen` | `TEXT` | NOT NULL |
| `is_active` | `INTEGER` | NOT NULL (0 or 1, default 1) |
| `allowed_scopes` | `TEXT` | JSON Array (NOT NULL) |
| `redirect_uris` | `TEXT` | JSON Array (NOT NULL) |
| `jwks` | `TEXT` | JSON Object (Nullable) |
| `jwks_uri` | `TEXT` | Nullable |
| `site_url` | `TEXT` | Nullable |
| `description` | `TEXT` | Nullable |
| `support_emails` | `TEXT` | JSON Array (Nullable) |
| `agreement_accepted`| `INTEGER` | NOT NULL (0 or 1) |
| `created_at` | `TIMESTAMP` | DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | `TIMESTAMP` | DEFAULT CURRENT_TIMESTAMP |

## Validation Rules

### URL Validation (Internal)

- **Requirement**: No IP addresses in `redirect_uris` or `site_url`.
- **Requirement**: HTTPS only, except for `localhost` in non-production.
- **Rule**: `!hostname.match(/^(\d{1,3}\.){3}\d{1,3}$/)` (IPv4)
- **Rule**: `!hostname.includes(':')` (Simple IPv6 check, should use more robust parsing)
- **Rule**: `url.protocol === 'https:' || (isDev && isLocalhost)`

### Scope Validation (Internal)

- **Rule**: `requestedScopes.every(s => client.allowedScopes.includes(s))`
