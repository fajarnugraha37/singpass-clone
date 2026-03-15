# Data Model: UserInfo Scope Handling

## Entities

### User
Represents a verified identity in the system.

| Attribute | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Globally unique identifier (subject) |
| `nric` | String | National Registration Identity Card number (or FIN) |
| `name` | String | Full name of the user |
| `email` | String | Verified email address |
| `mobileno` | String | Verified Singapore mobile number (without country code) |

## Mapping Matrix (Functional Data Model)

This feature implements the following mapping logic between scopes and data exposure.

### UserInfo Mapping (`person_info`)

| Scope | Response Field | Value Format |
|-------|----------------|--------------|
| `uinfin` | `person_info.uinfin` | `{ value: string }` |
| `name` | `person_info.name` | `{ value: string }` |
| `email` | `person_info.email` | `{ value: string }` |
| `mobileno` | `person_info.mobileno` | `{ value: string }` |

### ID Token Mapping (`sub_attributes`)

| Scope | Response Field | Source / Logic |
|-------|----------------|----------------|
| `user.identity` | `identity_number` | `user.nric` |
| `user.identity` | `identity_coi` | "SG" |
| `user.identity` | `account_type` | "standard" |
| `name` | `name` | `user.name` |
| `email` | `email` | `user.email` |
| `mobileno` | `mobileno` | `user.mobileno` |

## Validation Rules

- **Existence**: If a scope is granted but the corresponding data is null/empty in the system, the field MUST be omitted entirely from the response.
- **Identity Integrity**: If `user.identity` is granted but `identity_number` is missing, `identity_coi` and `account_type` MUST still be included in the response.
- **Legacy Compatibility**: `person_info` MUST be present in the UserInfo response, even if empty (`{}`), to ensure compatibility with client expectations for that field.
