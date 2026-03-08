# Data Model: OIDC Authorization Flow

## Entities

### Auth Session (`auth_sessions`)
Represents a temporary, secure state for a user currently authenticating.

- **id** (`text`, primary key): Unique session identifier, set in an HTTP-only cookie.
- **par_request_uri** (`text`, not null): The `request_uri` from the PAR step, linking to the initial request parameters.
- **client_id** (`text`, not null): The client initiating the auth flow.
- **user_id** (`text`, nullable): The authenticated user's ID (populated after primary login).
- **status** (`text` / enum): Current stage (e.g., `INITIATED`, `PRIMARY_AUTH_SUCCESS`, `2FA_PENDING`, `COMPLETED`, `FAILED`).
- **otp_code** (`text`, nullable): The simulated 6-digit SMS OTP for 2FA validation.
- **expires_at** (`integer` / datetime, not null): Expiration timestamp, strictly tied to the original PAR `expires_in`.
- **created_at** (`integer` / datetime, not null)
- **updated_at** (`integer` / datetime, not null)

### Authorization Code (`authorization_codes`)
The short-lived code issued after successful authentication, exchanged for tokens later.

- **code** (`text`, primary key): Secure, random one-time use string.
- **user_id** (`text`, not null): The authenticated user.
- **client_id** (`text`, not null): The client to which the code was issued.
- **code_challenge** (`text`, not null): PKCE challenge from the PAR payload.
- **dpop_jkt** (`text`, not null): DPoP thumbprint from the PAR payload.
- **nonce** (`text`, nullable): Nonce from the PAR payload, to be included in the ID Token later.
- **redirect_uri** (`text`, not null): Where the client will be redirected (or was redirected).
- **expires_at** (`integer` / datetime, not null): Expiration timestamp (typically 60 seconds).
- **used** (`integer` / boolean, not null): Flag ensuring single use.
- **created_at** (`integer` / datetime, not null)

## Relationships

- `auth_sessions.par_request_uri` conceptually links to the PAR storage (e.g., `par_requests.request_uri`).
- `authorization_codes.user_id` links to the users table.
- `authorization_codes.client_id` links to the clients table.
