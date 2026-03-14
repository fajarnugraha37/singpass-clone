# Data Model: PAR authentication_context_type Validation

## Domain Entities

### 1. ClientConfig (Update)
The `ClientConfig` interface describes a registered third-party application.

| Field | Type | Description |
|-------|------|-------------|
| `clientId` | `string` | Unique identifier (existing). |
| `clientName` | `string` | Human-readable name (existing). |
| `appType` | `'Login' \| 'Myinfo'` | **(NEW)** Identifies if the app is a Login or Myinfo application. |
| `redirectUris` | `string[]` | List of allowed callback URLs (existing). |
| `jwks` | `Record<string, any>` | Registered public keys for validation (existing). |

### 2. PushedAuthorizationRequest (Update in TypeScript, no DB change)
The internal representation of a PAR.

| Field | Type | Description |
|-------|------|-------------|
| `requestUri` | `string` | Unique OIDC request URI (existing). |
| `clientId` | `string` | ID of the client that created this request (existing). |
| `payload` | `Record<string, any>` | JSON object containing the PAR parameters (existing). |

**Stored Payload Fields (NEW in `payload`):**
- `authentication_context_type`: The mandatory context type for Login apps.
- `authentication_context_message`: An optional 100-character message.

## Validation Rules

### 1. authentication_context_type
- **Type**: `string`.
- **Enum**: Must match one of the predefined Singpass enum values (e.g., `APP_AUTHENTICATION_DEFAULT`, `BANK_CASA_OPENING`).
- **Presence**: Mandatory if `client.appType === 'Login'`, forbidden if `client.appType === 'Myinfo'`.

### 2. authentication_context_message
- **Type**: `string`.
- **Max Length**: 100 characters.
- **Allowed Characters**: `A-Za-z0-9 .,-@'!()`.
- **Presence**: Optional for `Login` apps, forbidden for `Myinfo` apps.

## State Transitions
Not applicable, PAR requests are immutable once stored.
