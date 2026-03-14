# Data Model: UserInfo Endpoint

## Entities

### User (from `users` table)
| Field | Type | Description |
|-------|------|-------------|
| id | string (UUID) | Unique user identifier (`sub`) |
| nric | string | User's NRIC/FIN (mapped to `uinfin` in `person_info`) |
| name | string | User's full name |
| email | string | User's email address |

### AccessToken (from `access_tokens` table)
| Field | Type | Description |
|-------|------|-------------|
| token | string | The opaque or JWT access token |
| userId | string (UUID) | Reference to `users.id` |
| clientId | string | The client identifier |
| dpopJkt | string | Thumbprint of the public key this token is bound to |
| scope | string | Space-separated list of authorized scopes |
| expiresAt | Date | Expiration timestamp |
| revoked | boolean | Whether the token has been revoked |

### UserInfo Response (JWE/JWS)

#### JWS Payload (Decrypted/Decoded)
| Field | Type | Description |
|-------|------|-------------|
| sub | string | Subject identifier (`users.id`) |
| iss | string | Issuer URL |
| aud | string | Client ID |
| iat | number | Issued at timestamp |
| person_info | object | Nested user claims based on scopes |

#### person_info Structure
| Field | Type | Description |
|-------|------|-------------|
| uinfin | object | `{ value: string }` - User's NRIC/FIN |
| name | object | `{ value: string }` - User's full name |
| email | object | `{ value: string }` - User's email |

## State Transitions
1. **Request**: `AccessToken` + `DPoP Proof` received.
2. **Validation**:
   - `AccessToken` is valid and not revoked.
   - `DPoP Proof` is valid and its `jkt` matches `AccessToken.dpopJkt`.
3. **Data Retrieval**: `User` found by `userId`.
4. **Filtering**: `person_info` fields filtered by `AccessToken.scope`.
5. **Transformation**: JWS signing followed by JWE encryption using `Client` encryption key.
