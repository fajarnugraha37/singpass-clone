# Quickstart: Verify Secure JWKS Export

This guide provides the steps to verify that the JWKS endpoint is correctly exposing public keys without any private components.

## Prerequisites

- The backend service must be running (for manual verification).
- `curl` and `jq` command-line tools should be available.

## Verification Steps

### 1. Run the Verification Unit Test

The most direct way to verify the fix is to run the newly created unit test.

```bash
# From the apps/backend directory
bun test ./tests/infra/adapters/jose_crypto_jwks.test.ts
```

The test should pass, confirming that the `d` parameter (and other private components) are not found in the programmatically fetched JWKS.

### 2. Manually Inspect the Endpoint

You can also manually query the endpoint and inspect the output.

1. **Start the backend service.**

2. **Use `curl` to fetch the keys:**

    ```bash
    curl https://localhost/.well-known/keys | jq
    ```

3. **Inspect the output.** A successful, secure response will look like this:

    ```json
    {
      "keys": [
        {
          "kty": "EC",
          "crv": "P-256",
          "x": "...",
          "y": "...",
          "use": "sig",
          "kid": "...",
          "alg": "ES256"
        }
      ]
    }
    ```

4. **Verify the absence of private keys.** You can use `grep` to fail if the `d` parameter is found. The following command should produce no output:

    ```bash
    curl -s https://localhost/.well-known/keys | grep '"d":'
    ```

### 3. Programmatic Verification (One-liner)

If you don't want to start the full server, you can verify the logic using this one-liner from the root:

```bash
cd apps/backend && bun -e "import { JoseCryptoService } from './src/infra/adapters/jose_crypto'; process.env.SERVER_KEY_ENCRYPTION_SECRET = '00'.repeat(32); const s = new JoseCryptoService(); await s.generateKeyPair(); console.log(JSON.stringify(await s.getPublicJWKS()))" | grep -v '"d":'
```
