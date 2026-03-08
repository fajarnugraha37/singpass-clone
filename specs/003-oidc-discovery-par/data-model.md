# Data Model

## PushedAuthorizationRequests
Stores the temporarily registered authorization requests from clients.

- `id`: string (Primary Key, UUID v4)
- `requestUri`: string (Unique reference)
- `clientId`: string (Authenticated client)
- `dpopJkt`: string (Thumbprint of the DPoP key bound to this request)
- `payload`: text (JSON string of the validated request body)
- `expiresAt`: integer (Unix timestamp for passive expiration)
- `createdAt`: integer (Unix timestamp)

**Validation Rules**:
- `requestUri` must be strictly unique to prevent collisions.
- Any retrieval of a PAR request must validate that the current time is strictly less than `expiresAt`. Expired rows are deemed invalid and implicitly ignored.

## ConsumedJti
Stores consumed JWT IDs to prevent replay attacks for client assertions.
- `jti`: string (Primary Key)
- `clientId`: string (The client identifier associated with the JTI)
- `expiresAt`: integer (Unix timestamp, typically 24h after consumption)
