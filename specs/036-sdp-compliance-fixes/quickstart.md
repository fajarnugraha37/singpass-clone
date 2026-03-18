# Quickstart: SDP Compliance Fixes

## 1. JWKS URI Setup
To use a JWKS URI for client authentication:
1. Host a JWKS file on a public HTTPS endpoint.
2. Update the client configuration:
   ```json
   {
     "clientId": "your-client-id",
     "clientName": "Your App Name",
     "jwksUri": "https://auth.example.com/.well-known/jwks.json",
     "environment": "Staging",
     "allowedScopes": ["openid", "profile"]
   }
   ```
3. The server will now fetch and cache keys from this URI during PAR and Token requests.

## 2. Scope Validation Test
1. Attempt a PAR request with a scope NOT in the `allowedScopes` list.
2. The server will reject with `400 Bad Request`:
   ```json
   {
     "error": "invalid_scope",
     "error_description": "Requested scope 'myinfo.nric_number' is not authorized for this client"
   }
   ```

## 3. IP Address Restriction
1. Try to register a client with a `redirect_uri` like `https://127.0.0.1/callback`.
2. The server will reject the configuration:
   ```json
   {
     "error": "invalid_configuration",
     "error_description": "IP addresses are not allowed in redirect_uri or site_url"
   }
   ```

## 4. Staging Test Account Limit
1. Link more than 100 users to a client in the 'Staging' environment.
2. The 101st linkage will fail with a `PRECONDITION_FAILED` error.
