# Quickstart: Testing Access Token Expiry Alignment

## 1. Verify Configuration
Ensure `packages/shared/src/config.ts` has the new configuration:

```typescript
export const sharedConfig = {
  // ...
  SECURITY: {
    // ...
    ACCESS_TOKEN_LIFESPAN: 1800, // 30 mins
  },
};
```

## 2. Token Exchange Test
Perform a standard token exchange flow. The response MUST contain:

```json
{
  "expires_in": 1800,
  "token_type": "DPoP",
  // ...
}
```

## 3. ID Token Inspection
Decode the issued `id_token` (e.g., using `jwt.io`).
- Verify `exp` claim is exactly `iat + 1800`.

## 4. Expiration Validation (Automated Test)
Run the integration tests for token validation:

```bash
bun test apps/backend/tests/integration/token_expiry.test.ts
```

This test should verify that:
1. A token is valid immediately after issuance.
2. A token is invalid 1801 seconds after issuance.
3. The lifespan changes when the configuration is modified.
