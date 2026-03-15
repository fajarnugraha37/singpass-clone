# Data Model: Scope Propagation Fix

The current data model is consolidated to use `authorization_codes` for all OIDC authorization code flows, ensuring that the authorized `scope` is carried through from the PAR phase to the token exchange phase.

## 1. AuthorizationCode (Updated)

The `authorization_codes` table is used to store transient codes issued after a successful user authentication session.

- **Table name**: `authorization_codes`
- **Primary key**: `code` (String/UUID)

### Fields
| Field | Type | Description |
|-------|------|-------------|
| code | TEXT | Unique authorization code value |
| userId | TEXT | The UUID of the authenticated user |
| clientId | TEXT | The client ID the code was issued to |
| codeChallenge | TEXT | The PKCE code challenge from the PAR |
| dpopJkt | TEXT | The DPoP public key thumbprint for binding |
| **scope** | **TEXT** | **Space-delimited string of authorized scopes (e.g., "openid uinfin")** |
| nonce | TEXT | OIDC nonce from the PAR |
| loa | INTEGER | Level of Assurance achieved |
| amr | TEXT | JSON stringified list of authentication methods used |
| redirectUri | TEXT | Valid redirect URI from the original PAR |
| expiresAt | DATETIME | One-time use expiration (typically 60 seconds) |
| used | BOOLEAN | Flag to prevent code reuse |
| createdAt | DATETIME | Timestamp of issuance |

## 2. Redundancy Cleanup

The following table is redundant and will be removed from the schema and any associated cleanup logic.

- **Table name**: `auth_codes` (REMOVED)

## 3. Relationships

- `AuthorizationCode` belongs to one `User` and one `Client`.
- `AccessToken` generated from this code will inherit the `scope` stored here.
- `IDToken` generated from this code will map claims based on the `scope` stored here.
