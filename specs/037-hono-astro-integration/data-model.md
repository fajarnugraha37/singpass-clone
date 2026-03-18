# Data Model: Full-stack Hono-Astro Integration

## Key Entities

### SessionContext
Represents the current user's session state on the client side, hydrated from the backend RPC.
- `clientId`: String (Unique identifier for the OIDC client)
- `clientName`: String (Display name for the application)
- `purpose`: String (Optional purpose for the auth request)
- `status`: String (One of: `pending`, `authenticated`, `expired`)
- `expiresAt`: DateTime (Session expiration time)

### ClientMetadata
Information about an OIDC client used for display in the UI.
- `clientName`: String (The primary display name)
- `clientId`: String (Cross-reference to Client ID)
- `logoUrl`: String (Optional URL for the client's logo)

### APIContract
The source of truth for all network communication.
- `route`: String (Path pattern)
- `method`: Enum (GET, POST, etc.)
- `schema`: ZodSchema (Validation for request/response)

## State Transitions
1.  **Initial State**: Component mounts, `SessionContext` is empty/null.
2.  **Hydrating**: RPC call to `/session` is in flight.
3.  **Success**: RPC returns 200 OK, `SessionContext` is populated.
4.  **Anonymous**: RPC returns 401 Unauthorized, UI falls back to "Login" view.
5.  **Error**: RPC fails (e.g., 500), UI handles with an error boundary.
