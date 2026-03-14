# Data Model: DPoP Replay Protection

## Entities

### JtiRecord (used_jtis table)

Represents a used JTI (JWT ID) from a DPoP proof, ensuring it cannot be re-used within its validity window.

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `jti` | string | Unique identifier for the DPoP proof. | Primary Key, Not Null |
| `clientId` | string | The ID of the client that presented the JTI. | Not Null |
| `expiresAt` | timestamp | When the JTI record can be safely pruned (after DPoP proof expiry). | Not Null |
| `createdAt` | timestamp | When the record was created. | Auto-generated |

## Relationships

- **Client -> JtiRecord**: One-to-many relationship (implied by `clientId`). Replay protection is scoped by `clientId` to prevent cross-client JTI collisions if desired, although global uniqueness is safer. The current implementation uses `(jti, clientId)` for lookups but `jti` as the primary key.

## State Transitions

1. **Check**: Before accepting a DPoP proof, the system checks if `(jti, clientId)` exists in the `used_jtis` table.
2. **Commit**: If the proof is valid and `jti` is new, the `jti` is inserted into the table with an `expiresAt` calculated as `iat + tolerance`.
3. **Reject**: If the `jti` already exists, the request is rejected with a `jti_reused` error.
4. **Prune**: (External process) Records where `expiresAt < now()` can be periodically deleted.
