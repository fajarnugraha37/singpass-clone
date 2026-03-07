# Server Implementation: UserInfo Endpoint

## Overview
The UserInfo endpoint provides additional identity and profile information about the user, tailored to the scopes requested during the authorization flow. This is primarily used for Myinfo integrations, but applicable to Singpass Login if custom scopes are used.

## Endpoint: `GET /userinfo`

### Request Headers
- `Authorization`: `DPoP <access_token>`
- `DPoP`: The DPoP proof JWT.

### Validation Requirements
1. **DPoP Token Validation**:
   - Validate the `DPoP` proof JWT (signature, `htm` matches `GET`, `htu` matches endpoint URL, `jti` is unique).
   - Extract the `jkt` (JWK Thumbprint) from the DPoP proof.
2. **Access Token Validation**:
   - Verify the `access_token` signature and expiration.
   - Verify that the `access_token`'s `cnf.jkt` claim EXACTLY matches the `jkt` calculated from the provided DPoP proof. This ensures the sender is the legitimate possessor of the DPoP private key.

### Payload Generation
Determine the user's data to return based on the `sub` associated with the access token and the authorized `scopes`.

1. Construct the `person_info` object (or just the flat claims, depending on the exact OIDC mapping desired).
2. Create a JWT payload containing standard claims: `sub`, `iss`, `aud` (client_id), `iat`.
3. Include the `person_info` in the payload.

### Signing & Encryption (JWS/JWE)
Like the `id_token`, Singpass wraps the Userinfo response in strict cryptography:
1. **Sign** the payload using the server's private ES256 key (JWS).
2. **Encrypt** the JWS using the Client's public encryption key (JWE).

### Response
Return a `200 OK` response with `application/jwt` or the raw JWE string.

### Error Handling
Return a 401 Unauthorized with standard OIDC error values (e.g., `invalid_token`, `invalid_dpop_proof`) in the response body and the `WWW-Authenticate` header.