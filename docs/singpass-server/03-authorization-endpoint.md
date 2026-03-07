# Server Implementation: Authorization Endpoint & Flow

## Overview
After the client successfully calls the PAR endpoint, it redirects the user's browser to the `/auth` endpoint, providing only the `client_id` and the `request_uri`. The server must process this and present the login/2FA UI.

## Endpoint: `GET /auth`

### Request Query Parameters
- `client_id`: Must match the client ID stored against the `request_uri`.
- `request_uri`: The URI retrieved from the PAR step.

### Server Steps
1. **Retrieve PAR Data**: Query the database using `request_uri` to fetch the stored FAPI 2.0 parameters (scopes, redirect_uri, nonce, state, code_challenge, dpop_jkt, etc.).
2. **Validate Request**: Check if the `request_uri` has expired or been used.
3. **Session Initiation**: Start a secure, cookie-backed session linking the browser to this authentication attempt.
4. **Render UI**: Present the Singpass-like UI (QR Code / Password Login + 2FA).
   - *This step requires rendering HTML/CSS (Astro/Svelte in our stack) to handle the user interaction securely.*
5. **Handle Authentication**: Authenticate the user (verify password & 2FA).
6. **Generate Code**: Generate a secure, one-time `authorization_code`. Store it in the database and tie it explicitly to the:
   - User ID
   - Client ID
   - `code_challenge` (PKCE)
   - `dpop_jkt` (DPoP Thumbprint)
   - `nonce`
   - Expiration (e.g., 60 seconds)
7. **Redirect User**: Redirect the user's browser back to the `redirect_uri` previously saved in the PAR payload.

```http
HTTP/1.1 302 Found
Location: https://client.example.com/callback?code=spl_xyz123...&state=abc
```

### Error Handling
If any error occurs (e.g., user cancels, `request_uri` is invalid), redirect back to the `redirect_uri` with the error parameters:
```http
HTTP/1.1 302 Found
Location: https://client.example.com/callback?error=invalid_request&state=abc
```