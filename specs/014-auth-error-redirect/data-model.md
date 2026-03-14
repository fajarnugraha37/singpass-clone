# Data Model: Auth Error Redirect Compliance

## Modified Entities

### AuthSession (Update)
- **id**: UUID (Primary Key)
- **parRequestUri**: String (Link to PAR request)
- **clientId**: String
- **userId**: String (optional)
- **status**: Enum ('INITIATED', 'PRIMARY_AUTH_SUCCESS', '2FA_PENDING', 'COMPLETED', 'FAILED')
- **otpCode**: String (optional)
- **retryCount**: Integer (default 0) - **[NEW]**
- **expiresAt**: DateTime
- **createdAt**: DateTime
- **updatedAt**: DateTime

## Entity Relationships
- `AuthSession` belongs to a `PARRequest` (via `parRequestUri`).
- `PARRequest` contains the original `redirect_uri` and `state`.
- `AuthSession` is used to validate `ValidateLogin` and `Validate2FA`.

## Constraints
- `retryCount` MUST NOT exceed 3 failed attempts.
- When `retryCount >= 3`, `status` MUST be set to `FAILED`.

### SecurityAuditLog (Reference)
- **id**: UUID
- **eventType**: Enum ('AUTH_TERMINAL_FAILURE', etc.)
- **severity**: Enum ('INFO', 'WARN', 'ERROR')
- **details**: JSON (captures sessionId, username, failure reason)
- **ipAddress**: String
- **createdAt**: DateTime

