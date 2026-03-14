# Quickstart: Verify Mock Client Encryption

To verify the `mock-client-id` now supports encryption:

1. **Verify Client Registry**:
   - Check `apps/backend/src/infra/adapters/client_registry.ts`.
   - Ensure `mock-client-id` has an `enc` key with `kid: mock-client-enc-key`.

2. **Run Token Exchange Test**:
   - Start the backend server.
   - Initiate a token exchange for `mock-client-id`.
   - Verify that the `id_token` in the response is a 5-part JWE string.

3. **Automated Test**:
   - Run `bun test apps/backend/tests/integration/token_exchange_encryption.test.ts` (once created).
   - The test should confirm that the `id_token` is correctly encrypted for `mock-client-id`.
