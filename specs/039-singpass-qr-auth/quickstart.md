# Quickstart: Singpass QR Authentication Flow

## Prerequisites
- **Singpass NDI Sandbox Credentials**: Ensure `SINGPASS_CLIENT_ID` and private keys are configured in `apps/backend/.env`.
- **DPoP Support**: Ensure the backend's DPoP middleware is active.
- **Drizzle Migrations**: Run migrations to create the `QRSessions` table.

## Local Implementation Steps

### 1. Backend (Hono)
- Implement `SingpassNDIAdapter` for PAR requests.
- Implement `SingpassQRController`:
  - `POST /auth/singpass/qr/init`: Calls `SingpassNDIAdapter.pushAuthorizationRequest()`, saves session, returns `request_uri`.
  - `GET /auth/singpass/qr/status/:sessionId`: Implements Long Polling for session updates.
  - `GET /auth/singpass/callback`: Handles the OIDC redirect from Singpass.

### 2. Shared Packages
- Add the `QRSessions` schema to `packages/shared`.
- Define RPC types for the new endpoints.

### 3. Frontend (Svelte 5)
- Create `QRAuth.svelte` (or refactor `QRPlaceholder.svelte`).
- Use `$state` to track session info and `$effect` to handle the polling loop.
- Use a QR library (e.g., `qrcode.svelte` or `svg-qr-code`) to render the URL.

## Testing Flow

### Automated Tests
1. **Unit Tests (Backend)**:
   - Mock `SingpassNDIAdapter` to test the controller logic.
   - Verify that session status is correctly updated on callback.
2. **Component Tests (Svelte)**:
   - Use `testing-library/svelte` to verify the polling state transitions.

### Manual Verification
1. Open the login page.
2. Verify a QR code is generated.
3. Use the Singpass Staging App to scan and authorize.
4. Verify the desktop browser redirects to `/dashboard` automatically.

## Common Error Codes
- `invalid_request_uri`: The PAR session expired (60s). Refresh the QR code.
- `unauthorized_client`: Check `client_assertion` signing logic.
