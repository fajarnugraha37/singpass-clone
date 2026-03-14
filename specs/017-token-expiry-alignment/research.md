# Research: Access Token Expiry Alignment

## Decision: Configurable Access Token Lifespan
- **What was chosen**: Add `ACCESS_TOKEN_LIFESPAN: 1800` to `sharedConfig.SECURITY` in `packages/shared/src/config.ts` and use it in `TokenService`.
- **Rationale**: Aligns with Singpass specifications (30 minutes) while maintaining the project's architecture for configurability.
- **Alternatives considered**: Hardcoding `1800` in `TokenService`. Rejected because the requirement explicitly asked for configurability via `sharedConfig`.

## Technical Findings

### 1. Configuration Location
The `sharedConfig` is defined in `packages/shared/src/config.ts`. It currently contains several TTL values (DPOP, PAR, SESSION, AUTH_CODE) but is missing an explicit `ACCESS_TOKEN_LIFESPAN`.

### 2. Token Generation Logic
`apps/backend/src/core/application/services/token.service.ts` contains the `TokenService.generateTokens` method, which currently hardcodes `expiresIn = 3600`. This is the primary point of change.

### 3. Expiration Validation
- **Token Exchange**: The `token-exchange.ts` use case stores the access token in the database with an `expiresAt` value calculated using the `expires_in` returned by `TokenService`.
- **UserInfo Validation**: The `get-userinfo.ts` use case retrieves the token from the repository and checks `tokenData.expiresAt < new Date()`. Since the `expiresAt` is correctly calculated during exchange, no changes are needed in the validation logic itself.

### 4. ID Token Expiration
The `ID Token` also uses the `expiresIn` parameter in `TokenService.generateTokens`. This will also be updated to 1800s, ensuring consistency between access token lifespan and ID token expiration (as requested or implied by OIDC standards where they often align for session simplicity).

## Dependencies & Constraints
- **Hexagonal Architecture**: Changes must remain within the service/use-case layers and configuration adapters.
- **OIDC/Singpass Compatibility**: The `expires_in` value must be a number representing seconds.
