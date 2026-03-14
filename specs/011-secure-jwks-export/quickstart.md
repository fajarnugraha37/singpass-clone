# Quickstart: Verify Secure JWKS Export

This guide provides the steps to verify that the JWKS endpoint is correctly exposing public keys without any private components.

## Prerequisites

- The backend service must be running.
- `curl` and `jq` command-line tools should be available.

## Verification Steps

### 1. Run the Verification Unit Test

The most direct way to verify the fix is to run the newly created unit test.

```bash
# From the apps/backend directory
bun test --test-file="path/to/your/new_jwks_test.ts"
```

The test should pass, confirming that the `d` parameter is not found in the programmatically fetched JWKS.

### 2. Manually Inspect the Endpoint

You can also manually query the endpoint and inspect the output.

1.  **Start the backend service.**

2.  **Use `curl` to fetch the keys:**

    ```bash
    curl http://localhost:3000/.well-known/keys | jq
    ```

3.  **Inspect the output.** A successful, secure response will look like this:

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

4.  **Verify the absence of private keys.** You can use `grep` to fail if the `d` parameter is found. The following command should produce no output:

    ```bash
    curl -s http://localhost:3000/.well-known/keys | grep '"d":'
    ```

If the command produces any output, the private key component is still being exposed.
