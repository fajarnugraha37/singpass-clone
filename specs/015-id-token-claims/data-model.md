# Data Model: ID Token Claims

## Schema Changes

### `sessions` Table
| Column | Type | Description |
|--------|------|-------------|
| `amr` | `text` | Stringified JSON array of authentication methods (e.g., `["pwd", "otp-sms"]`). |

### `access_tokens` Table
| Column | Type | Description |
|--------|------|-------------|
| `loa` | `integer` | Level of Assurance (1, 2, or 3) captured at token issuance. |
| `amr` | `text` | Stringified JSON array of authentication methods captured at token issuance. |

## Domain Models

### `Session`
- `id`: string
- `userId`: string | null
- `dpopJkt`: string | null
- `loa`: number
- `amr`: string[]
- `isAuthenticated`: boolean
- `expiresAt`: Date

### `AuthCodeSessionData`
- `sessionId`: string
- `parId`: number
- `userId`: string | null
- `dpopJkt`: string
- `loa`: number
- `amr`: string[]

## Claim Mapping (OIDC Standard)

### `acr` (Authentication Context Class Reference)
- 1 -> `urn:singpass:authentication:loa:1`
- 2 -> `urn:singpass:authentication:loa:2`
- 3 -> `urn:singpass:authentication:loa:3`

### `sub_attributes` (Singpass Specific)
Mapped from `User` entity based on authorized scopes:
- **`user.identity`**:
  - `identity_number` -> `users.nric`
  - `identity_coi` -> `"SG"`
  - `account_type` -> `"standard"`
- **`name`**:
  - `name` -> `users.name`
- **`email`**:
  - `email` -> `users.email`
- **`mobileno`**:
  - `mobileno` -> `users.mobileno`
