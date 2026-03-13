# Data Model: FAPI 2.0 Token Exchange

## Entities

### 1. AuthorizationCode (Existing)
*Represents a short-lived code used to exchange for tokens.*

| Field | Type | Description |
|---|---|---|
| `code` | string (PK) | The authorization code. |
| `userId` | string | ID of the authenticated user. |
| `clientId` | string | ID of the client. |
| `codeChallenge` | string | PKCE code challenge. |
| `dpopJkt` | string | Thumbprint of the DPoP key bound to this code. |
| `nonce` | string (Optional) | Nonce from the original request. |
| `redirectUri` | string | Must match the URI used in the PAR phase. |
| `expiresAt` | Date | Expiration time (typically 5-10 minutes). |
| `used` | boolean | Flag to prevent replay (P1 requirement). |

### 2. AccessToken (New)
*Represents a DPoP-bound access token.*

| Field | Type | Description |
|---|---|---|
| `id` | string (PK) | Unique identifier for the token. |
| `token` | string (Unique) | The opaque access token string. |
| `userId` | string | ID of the user. |
| `clientId` | string | ID of the client. |
| `dpopJkt` | string | Thumbprint of the DPoP key bound to this token. |
| `scope` | string | Granted scopes (e.g., `openid name`). |
| `expiresAt` | Date | Expiration time (e.g., 30-60 minutes). |
| `revoked` | boolean | Flag for token revocation. |

### 3. ClientConfig (Expanded)
*Configuration for registered OIDC clients.*

| Field | Type | Description |
|---|---|---|
| `clientId` | string (PK) | Unique client identifier. |
| `clientName` | string | Display name for the client. |
| `redirectUris` | string[] | Allowed redirect URIs. |
| `jwks` | object | Client's public keys (Signing and Encryption). |
| `jwks.keys[].use` | "sig" \| "enc" | Key usage. |
| `jwks.keys[].alg` | string | Algorithm (e.g., `ES256`, `ECDH-ES+A256KW`). |

### 4. UsedJti (Existing)
*Used to prevent DPoP proof replay.*

| Field | Type | Description |
|---|---|---|
| `jti` | string (PK) | Unique DPoP proof identifier. |
| `clientId` | string | Associated client. |
| `expiresAt` | Date | Cleanup after expiry. |

## Relationships
- `AuthorizationCode` belongs to one `User` and one `Client`.
- `AccessToken` belongs to one `User` and one `Client`.
- `AccessToken` is bound to the same `dpopJkt` as the `AuthorizationCode` it was exchanged for.

## Validations
- **Authorization Code**: MUST NOT be reused (`used` must be false).
- **PKCE**: `code_verifier` SHA-256 hash MUST match `codeChallenge`.
- **DPoP**: `DPoP` header JWT signature MUST be valid using the embedded `jwk`. Thumbprint of `jwk` MUST match `dpopJkt`.
- **Client Assertion**: JWT `sub` and `iss` MUST match `clientId`. `aud` MUST match server issuer. Signature MUST match a `use: sig` key in client's `jwks`.
