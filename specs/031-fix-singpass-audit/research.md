# Research: Remediate Singpass Compliance Audit Findings

## Decisions

### 1. DPoP-Nonce Generation & Storage
- **Decision**: Use `CryptoService.generateDPoPNonce` to generate a secure random string (UUID or secure random hex).
- **Rationale**: The `CryptoService` interface already has placeholders for this. Nonces will be stored in the existing `PARRepository` or a dedicated `NonceRepository` (if needed) with a short TTL (e.g., 2-5 minutes).
- **Alternatives considered**: Storing nonces only in-memory (rejected because it doesn't work well with horizontal scaling, though we are using a single-instance SQLite for now, it's better to persist them).

### 2. DPoP Error Handling
- **Decision**: Update `FapiErrors` to include a `useDpopNonce` helper that returns a 401 status code and sets the `WWW-Authenticate` header.
- **Rationale**: This is a direct requirement of the FAPI 2.0 and Singpass specification for nonce enforcement.

### 3. Account Type Persistence
- **Decision**: Add an `account_type` column to the `users` table in the SQLite database via Drizzle ORM.
- **Rationale**: Storing this in the database allows for user-specific identity claims as required by the audit findings.

### 4. PAR TTL Configuration
- **Decision**: Update `sharedConfig.SECURITY.PAR_TTL_SECONDS` to `60`.
- **Rationale**: Strictly aligns with the Singpass specification for `request_uri` validity.

## Findings

### Singpass Integration Guide (v5/FAPI 2.0)
- **PAR request_uri**: Valid for 60 seconds.
- **state/nonce**: Unique, cryptographically secure strings, minimum length of 30 characters.
- **DPoP-Nonce**: Server-provided nonce required to be included in subsequent DPoP proof JWTs for freshness.
- **ID Token Claims**: `sub_attributes.account_type` should be `"standard"` or `"foreign"`.
- **Native App Parameters**: `redirect_uri_https_type` and `app_launch_url` are optional but supported Singpass-specific fields.
