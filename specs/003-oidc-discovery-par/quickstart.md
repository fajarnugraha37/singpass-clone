# Quickstart: OIDC Discovery & PAR

This guide provides steps to manually verify the OIDC Discovery and PAR endpoints.

1. **Start the API Server**: Ensure the Hono backend is running.
   ```bash
   cd apps/backend
   bun run dev
   ```

2. **Verify Public Endpoints**:
   - Navigate to `http://localhost:3000/.well-known/openid-configuration` in a browser or via `curl`. It should return a valid JSON document conforming to the FAPI 2.0 structure.
   - Navigate to `http://localhost:3000/.well-known/keys`. It should return an EC P-256 JSON Web Key Set.

3. **Test PAR Endpoint (`POST /par`)**:
   - Because this endpoint requires a cryptographic assertion (`client_assertion`) and PKCE validation, simple `curl` commands are complex.
   - Use a script utilizing the `jose` library to generate a client assertion JWT.
   - Example generic test payload (replace `JWT` with actual valid signatures):
     ```bash
     curl -X POST http://localhost:3000/par \
       -H "Content-Type: application/x-www-form-urlencoded" \
       -d "client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer" \
       -d "client_assertion=<JWT>" \
       -d "client_id=test-client" \
       -d "response_type=code" \
       -d "scope=openid" \
       -d "redirect_uri=https://client.example.com/cb" \
       -d "code_challenge=test_challenge" \
       -d "code_challenge_method=S256" \
       -d "state=test_state" \
       -d "nonce=test_nonce" \
       -d "authentication_context_type=login"
     ```
   - Expect a `201 Created` response containing `request_uri` and `expires_in` if the client assertion matches a registered client.
