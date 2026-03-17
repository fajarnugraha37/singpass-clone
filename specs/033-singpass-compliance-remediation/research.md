# Research: Singpass Compliance Remediation

## Findings & Decisions

### 1. DPoP-Nonce Implementation
- **Finding**: The `JoseCryptoService` and `DPoPValidator` already contain methods for generating and validating nonces. Both `RegisterParUseCase` and `TokenExchangeUseCase` are already utilizing these methods to enforce nonce freshness as required by FAPI 2.0 / Singpass v5.
- **Decision**: No new logic is required for nonce generation/validation, but existing tests must be expanded to cover the full "fresh nonce" flow (server returns 401 with fresh nonce, client retries).
- **Rationale**: The core infrastructure is present and follows the `use_dpop_nonce` error pattern from RFC 9449.

### 2. NRIC to UUID Migration
- **Finding**: `ValidateLoginUseCase` has been updated to set `session.userId` to the database user ID (UUID) instead of the NRIC. `TokenService` correctly maps this `userId` to the `sub` claim in the ID Token.
- **Decision**: Confirm consistency across all token-issuing paths (Token Exchange, Refresh Token, UserInfo).
- **Rationale**: Privacy requirements mandate that NRIC is never used as the `sub` identifier.

### 3. MyInfo Metadata
- **Finding**: While the `MyinfoPerson` domain model and `withMeta` helper are correctly defined to include `source`, `classification`, and `lastupdated`, the **Seed Data** (`apps/backend/src/infra/database/seed-myinfo.ts`) is currently overwriting these structures with plain `{ value: T }` objects.
- **Decision**: Update `seed-myinfo.ts` to use a helper that preserves metadata or use the domain's `withMeta` helper during seeding.
- **Rationale**: Seeded data must mirror real-world MyInfo responses to be useful for Relying Party testing.

### 4. Purpose Limitation
- **Finding**: The `purpose` parameter is already included in `parRequestSchema`, stored in the database (`par_requests` and `auth_sessions`), and displayed in the frontend `login.astro` via a session API call.
- **Decision**: Ensure that the `purpose` is also included in the `AuthorizationCode` binding to prevent substitution attacks, although current session-based tracking is mostly sufficient.
- **Rationale**: Explicit transparency of data access intent is a key Singpass principle.

## Technical Unknowns Resolved

| Unknown | Resolution |
|---------|------------|
| DPoP Nonce Storage | Nonces are currently ephemeral (signed JWTs) and validated statelessy via the server's signing key. This is acceptable for a mock environment but would need a persistent cache (Redis) for a high-availability production setup. |
| MyInfo Metadata Defaults | Source "1" for government-verified (default), Source "4" for user-provided (email, mobile). Classification "C" (Confidential) and fixed `lastupdated` date are sufficient for the mock. |
| UUID Persistence | The database schema already uses `text().primaryKey().$defaultFn(() => crypto.randomUUID())` for the `users` table, ensuring persistent UUIDs. |
