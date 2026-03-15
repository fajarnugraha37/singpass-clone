# Quickstart: Scope Propagation Fix

This feature ensures that the authorized scopes (e.g., `uinfin`, `name`, `email`) from the PAR phase are correctly propagated through the authorization code to the access token and finally to the UserInfo endpoint.

## 1. Verify Scope Propagation

To verify the scope propagation, run the integration tests:

```bash
bun test apps/backend/tests/integration/token-exchange.test.ts
bun test apps/backend/tests/integration/userinfo.test.ts
```

Specifically, ensure that a PAR request with `scope="openid uinfin"` results in an ID Token with a `uinfin` claim and a UserInfo response with a `person_info.uinfin` field.

## 2. Reproduction Test

A new test case has been added to `apps/backend/tests/repro_scope_propagation.test.ts` to reproduction the scenario where `person_info` is missing if the scope is not correctly propagated.

To run it:

```bash
bun test apps/backend/tests/repro_scope_propagation.test.ts
```

## 3. Database Consolidation

The redundant `auth_codes` table has been removed from the schema. To ensure your database matches the new schema:

```bash
# Apply migrations or push the schema change
bunx drizzle-kit push:sqlite
```
