# Data Model

## PushedAuthorizationRequests
Stores the temporarily registered authorization requests from clients.

- `id`: string (Primary Key, UUID v4)
- `requestUri`: string (Unique, formatted as `urn:ietf:params:oauth:request_uri:<random_string>`)
- `clientId`: string (Indexed, the authenticated client that originated the request)
- `payload`: text (JSON string of the validated request body parameters)
- `expiresAt`: integer (Unix timestamp in milliseconds for passive expiration, typically now + 60s)
- `createdAt`: integer (Unix timestamp in milliseconds)

**Validation Rules**:
- `requestUri` must be strictly unique to prevent collisions.
- Any retrieval of a PAR request must validate that the current time is strictly less than `expiresAt`. Expired rows are deemed invalid and implicitly ignored.
