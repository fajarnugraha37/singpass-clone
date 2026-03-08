# Quickstart: OIDC Authorization Flow

## Prerequisites
Ensure your local environment is running the monorepo.
```bash
bun install
bun run dev
```

## Testing the Flow
1. **Initialize a PAR Request** (Simulation)
   Send a `POST /api/oauth2/v1/par` request (implemented in a previous feature) to get a `request_uri`.

2. **Navigate to Auth Endpoint**
   In your browser, visit the backend `/auth` endpoint with the generated values:
   `http://localhost:3000/auth?client_id=YOUR_CLIENT_ID&request_uri=urn:ietf:params:oauth:request_uri:XYZ`

3. **Login**
   - The backend will redirect you to the Astro frontend (`http://localhost:4321/login`).
   - Enter your primary credentials.

4. **Simulated 2FA**
   - After a successful password login, you will be redirected to the 2FA screen.
   - The simulated 6-digit OTP will be printed to the backend server console.
   - Enter the OTP in the UI.

5. **Completion**
   - Upon successful 2FA, the frontend will receive the final redirect URI containing the Authorization Code (`?code=...&state=...`).
   - The browser should redirect back to your client application's callback URL.
