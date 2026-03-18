# Research: Singpass QR Authentication Flow

## Technical Unknowns & Clarifications

### 1. QR Code Content & Generation
- **Decision**: The QR code will contain the full Singpass Authorization URL, including the `client_id` and the `request_uri` obtained from the PAR endpoint.
- **Rationale**: This follows the standard OIDC/FAPI 2.0 flow for Singpass. The Singpass App scans this URL to initiate the mobile-side authorization.
- **Implementation**: Use a standard QR code generation library (e.g., `qrcode` or similar) in the frontend or backend. Given Svelte 5 usage, a lightweight frontend library or a backend-generated SVG is preferred.

### 2. Status Polling Mechanism
- **Decision**: Implement Long Polling via a dedicated Hono RPC endpoint.
- **Rationale**: While WebSockets provide lower latency, Long Polling is simpler to implement, highly reliable across different network conditions, and fits well with the Hono/Astro architecture without requiring a persistent socket server.
- **Alternatives Considered**: WebSockets (rejected for complexity vs value in this specific "one-off" auth flow), Server-Sent Events (considered, but Long Polling is more universally compatible with proxy/firewall setups often found in enterprise environments).

### 3. QR Session State Management
- **Decision**: Store `QRSession` state in the SQLite database using Drizzle ORM.
- **Rationale**: Ensures persistence across server restarts and allows the callback handler (which receives the `code` from Singpass) to update the status that the frontend is polling for.
- **Fields**: `id`, `state`, `nonce`, `request_uri`, `status` (PENDING, AUTHORIZED, etc.), `auth_code`, `expires_at`.

### 4. FAPI 2.0 / DPoP Integration
- **Decision**: Reuse existing `@vibe-auth/shared` and backend utilities for JWS/JWE and DPoP.
- **Rationale**: The project already has FAPI core infra (Feature 002).
- **Details**: The PAR request must include a `DPoP` header or `dpop_jkt`. We will use the `DPoP` header approach as recommended by Singpass docs for simplicity.

### 5. Frontend Lifecycle Management (Svelte 5)
- **Decision**: Use a `$state` object to track the current QR session and an `$effect` to handle the polling loop.
- **Rationale**: Svelte 5's runes provide a clean, reactive way to manage the transition from `PENDING` to `AUTHORIZED` or `EXPIRED`.
- **Flow**:
  1. `$effect` triggers on mount.
  2. Calls backend to initiate PAR.
  3. Receives `request_uri` and displays QR.
  4. Starts Long Polling loop.
  5. On `AUTHORIZED`, triggers a client-side redirect.

## Best Practices

- **Security**: The `state` parameter must be verified on the callback. The `request_uri` has a short 60s TTL; the frontend must handle expiration and auto-refresh.
- **Resilience**: Implement exponential backoff for polling if errors occur. Ensure the "Password Login" fallback remains functional if Singpass NDI is down.
- **Architecture**: Use a `SingpassAdapter` to encapsulate all outgoing calls to Singpass endpoints, keeping the `AuthService` clean.
