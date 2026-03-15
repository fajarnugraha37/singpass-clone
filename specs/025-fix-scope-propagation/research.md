# Research: Scope Propagation Fix

## Decision: Consolidate Authorization Code Schema and Verify Propagation

The current codebase contains two tables in `schema.ts`: `auth_codes` and `authorization_codes`. The `DrizzleAuthorizationCodeRepository` correctly uses `authorization_codes`, which already includes a `scope` column. However, the redundant `auth_codes` table is still present and used by the `cleanup.ts` script.

We will consolidate the schema to use only `authorization_codes` and verify the end-to-end scope propagation from PAR to UserInfo.

### Rationale
- **Redundancy**: Having two tables for the same purpose leads to confusion and maintenance overhead.
- **Propagation Verification**: While the code appears to implement scope propagation, the finding explicitly states it is broken. A rigorous integration test is required to confirm the failure state and verify the fix.

### Findings
- `AuthorizationCode` interface: `apps/backend/src/core/domain/authorizationCode.ts` (Already has `scope`).
- `Drizzle Schema`: `apps/backend/src/infra/database/schema.ts` (Has both `authCodes` and `authorizationCodes`).
- `GenerateAuthCodeUseCase`: `apps/backend/src/core/use-cases/GenerateAuthCode.ts` (Already maps `payload.scope`).
- `TokenExchangeUseCase`: `apps/backend/src/core/use-cases/token-exchange.ts` (Already uses `authCode.scope`).
- `GetUserInfoUseCase`: `apps/backend/src/core/use-cases/get-userinfo.ts` (Already uses `tokenData.scope`).
- `mapUserInfoClaims`: `apps/backend/src/core/domain/userinfo_claims.ts` (Correctly filters by scopes).

### Potential Issues Identified
1. **Mock Inconsistency**: The existing tests for token exchange (`apps/backend/tests/integration/token-exchange.test.ts`) use mocks for `getByCode` that OMIT the `scope` field. This might have hidden bugs or caused failures in other tests that rely on these mocks.
2. **Database Schema Confusion**: The `cleanup.ts` script uses the redundant `authCodes` table instead of `authorizationCodes`.

### Alternatives Considered
- **Keep both tables**: Rejected. Violates KISS and DRY principles.
- **Rename `authorization_codes` back to `auth_codes`**: Rejected. `authorization_codes` is already well-integrated into the repository and use cases.

## Next Steps
1. Create a reproduction test case in `apps/backend/tests/repro_scope_propagation.test.ts` to confirm if the bug actually exists in the current runtime state.
2. If the bug exists (e.g., due to a mismatch in repository or database mapping), apply the fix.
3. Consolidate `schema.ts` by removing the redundant `authCodes` table and updating `cleanup.ts`.
4. Update all mocks in tests to include the `scope` field.
