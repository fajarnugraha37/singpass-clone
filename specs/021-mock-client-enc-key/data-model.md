# Data Model: Client Configuration

## Entity: ClientConfig
Represents an OIDC client configuration in the registry.

| Field | Type | Description |
|-------|------|-------------|
| `clientId` | string | Unique identifier for the client (e.g., `mock-client-id`). |
| `clientName` | string | Human-readable name of the application. |
| `appType` | enum | Application type, either `Login` or `Myinfo`. |
| `redirectUris` | string[] | List of allowed callback URIs. |
| `jwks` | object | JSON Web Key Set containing public keys for the client. |

### JWK Attributes (for encryption)
- **kty**: `EC`
- **crv**: `P-256`
- **use**: `enc` (Encryption)
- **alg**: `ECDH-ES+A256KW`
- **x**: Base64URL-encoded coordinate
- **y**: Base64URL-encoded coordinate
- **kid**: Unique identifier for the key within the client's JWKS.

## State Transitions
N/A - This is static mock data.
