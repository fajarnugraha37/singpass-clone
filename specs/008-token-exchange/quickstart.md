# Quickstart: FAPI 2.0 Token Exchange

## 1. Prerequisites
- **Hono Backend**: Ensure the backend service is running.
- **Client JWKS**: Prepare a client keypair for signing and encryption.
- **Authorization Code**: Obtain a valid `code` from the authorization endpoint.

## 2. Mock Client Setup
Add a mock client to `apps/backend/src/infra/adapters/client_registry.ts` with both signing and encryption keys.

```typescript
'test-client': {
  clientId: 'test-client',
  clientName: 'Test App',
  redirectUris: ['http://localhost:3000/cb'],
  jwks: {
    keys: [
      { kty: 'EC', crv: 'P-256', use: 'sig', ... }, // Signing Key
      { kty: 'EC', crv: 'P-256', use: 'enc', ... }  // Encryption Key
    ]
  }
}
```

## 3. Token Request Example (using `curl`)

```bash
curl -X POST http://localhost:3000/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "DPoP: <DPoP_Proof_JWT>" \
  -d "grant_type=authorization_code" \
  -d "code=<AUTH_CODE>" \
  -d "redirect_uri=http://localhost:3000/cb" \
  -d "code_verifier=<PKCE_VERIFIER>" \
  -d "client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer" \
  -d "client_assertion=<CLIENT_ASSERTION_JWT>"
```

## 4. Troubleshooting
- **`invalid_dpop_proof`**: Ensure the `DPoP` header is a valid JWS signed by the client's ephemeral key.
- **`invalid_client`**: Verify the `client_assertion` is signed by the client's private key and that the server has the corresponding public key in the registry.
- **`invalid_grant`**: Check if the code has expired or has already been used.
