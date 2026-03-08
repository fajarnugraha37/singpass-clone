# Feature Specification: OIDC Authorization Endpoint and Login Flow

**Feature Branch**: `005-oidc-auth-flow`
**Created**: 2026-03-08
**Status**: Draft
**Input**: User description: "Implement the OIDC Authorization Endpoint and the interactive login flow. Goal: Connect the OIDC `/auth` flow to the frontend UI, including the 2FA fallback flow. Context Files: docs/singpass-server/03-authorization-endpoint.md Requirements: 1. Implement `GET /auth`. Validate `client_id` and `request_uri` (retrieved from the PAR database). Create a secure cookie session and redirect the user to the Astro login page. 2. Connect the Astro frontend login form to the backend via Hono RPC. 3. Upon submitting the Password login, redirect the user to a 2FA screen (Simulated SMS OTP). 4. Upon successful 2FA, generate an Authorization Code linked to the PKCE `code_challenge` and DPoP key. 5. Redirect the user back to the client's `redirect_uri` appending `?code=...&state=...`. 6. Implement proper error redirects (`error`, `error_description`, `state`) as per OIDC specs. 7. make sure all endpoints match with docs/singpass-server/ both path, body, etc"

## Clarifications

### Session 2026-03-08
- Q: How should the temporary secure auth session (tracking login & 2FA progress) be stored? → A: Stateful: Stored in SQLite via Drizzle ORM, referenced by a session ID in an HTTP-only cookie.
- Q: What specific mechanism will be used to simulate SMS OTP delivery for testing/development? → A: Generate a random 6-digit OTP, store it in the session, and log it to the console or display it in the UI.
- Q: How does the Astro frontend communicate with the backend via Hono RPC? → A: Client-side calls: The browser directly calls the Hono backend API using CORS and credentials, since Astro is SSG.
- Q: How long should the login session live before timing out? → A: Tie the session expiration strictly to the `expires_in` value of the original PAR request (typically 60-90 seconds).
- Q: If the `GET /auth` endpoint receives fundamentally invalid parameters (e.g., completely missing or unparseable `request_uri`), how should the error be presented? → A: Display a generic error page hosted on the Astro frontend (e.g., "Invalid Request").
- Q: How does the system handle concurrent login attempts from the same browser? → A: Terminate the old session and start a new one (Last-writer wins).
- Q: How are unexpected server errors handled during the Hono RPC calls from the frontend? → A: Use a standard OIDC error code (e.g. 'server_error' or 'access_denied') in the redirect parameters.
- Q: What happens when the user takes too long to complete the login/2FA and the session or `request_uri` expires (based strictly on the original PAR request `expires_in`)? → A: Redirect to `redirect_uri` with OIDC error parameters (e.g., `error=access_denied&error_description=session_expired`).
- Q: What happens if the `redirect_uri` provided in the original request does not match the registered client configuration? → A: Display a generic "Invalid Request" error page hosted on the Astro frontend.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Secure Authentication Initiation (Priority: P1)

As a relying party user, I want to initiate an OIDC authorization request so that I can log in securely to the application.

**Why this priority**: Initiating the authorization is the first step in the flow. If we can't capture the `request_uri` from a previously registered PAR (Pushed Authorization Request) and create a session, the rest of the flow cannot happen.

**Independent Test**: Can be independently tested by sending a valid `GET /auth` request with a valid `client_id` and `request_uri` and ensuring the system responds with a secure cookie session and a redirect to the frontend login page.

**Acceptance Scenarios**:

1. **Given** a valid `client_id` and `request_uri` (pre-registered via PAR), **When** a user makes a `GET /auth` request, **Then** the server creates a secure cookie session and redirects the user to the Astro login page.
2. **Given** an invalid `client_id` or an expired/invalid `request_uri`, **When** a user makes a `GET /auth` request, **Then** the server redirects back to the client's `redirect_uri` (or shows an error page if the `redirect_uri` is invalid) with proper OIDC error parameters (`error`, `error_description`, `state`).

---

### User Story 2 - Primary Login and 2FA Verification (Priority: P1)

As an end user, I want to authenticate via password and then complete a 2FA flow (Simulated SMS OTP) so that my identity is strongly verified.

**Why this priority**: This is the core interactive part of the authentication flow.

**Independent Test**: Can be tested by filling out the login form on the frontend, submitting it, progressing to the 2FA screen, and successfully submitting a simulated SMS OTP.

**Acceptance Scenarios**:

1. **Given** a user is on the login page with an active session, **When** they submit valid primary credentials, **Then** they are redirected to a 2FA (Simulated SMS OTP) screen.
2. **Given** a user is on the 2FA screen, **When** they submit a valid simulated OTP (which was generated, stored in session, and output to console/UI), **Then** the backend registers a successful 2FA completion.
3. **Given** a user submits invalid credentials or an invalid OTP, **When** the form is submitted, **Then** they see an appropriate error message and are prompted to try again.

---

### User Story 3 - Authorization Code Generation and Redirect (Priority: P1)

As an authenticated user, I want to be redirected back to the relying party application with an authorization code so that the application can finalize the login process.

**Why this priority**: Completing the OIDC flow by issuing the authorization code is what allows the client application to obtain the ID/Access tokens subsequently.

**Independent Test**: Can be tested by completing the 2FA flow and verifying that the final redirect contains a valid `code` and the correct `state` parameter.

**Acceptance Scenarios**:

1. **Given** a user has successfully completed the 2FA verification, **When** the authentication is finalized, **Then** the server generates an Authorization Code linked to the initial PKCE `code_challenge` and DPoP key.
2. **Given** an Authorization Code has been generated, **When** the finalization process finishes, **Then** the user is redirected to the client's registered `redirect_uri` with the `code` and `state` parameters appended.

---

### Edge Cases

- **Invalid/Unparseable request_uri**: Display a generic error page hosted on the Astro frontend (e.g., "Invalid Request") instead of redirecting back.
- **Expired session/request_uri**: Redirect to `redirect_uri` with OIDC error parameters (e.g., `error=access_denied&error_description=session_expired`).
- **Concurrent login attempts**: Terminate the old session and start a new one (Last-writer wins).
- **Unexpected server errors (RPC)**: Use a standard OIDC error code (e.g. 'server_error' or 'access_denied') in the redirect parameters.
- **Invalid redirect_uri**: Display a generic "Invalid Request" error page hosted on the Astro frontend.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST expose a `GET /auth` endpoint matching the specifications in `docs/singpass-server/03-authorization-endpoint.md`.
- **FR-002**: The `GET /auth` endpoint MUST validate the `client_id` and the `request_uri` against the stored PAR database records.
- **FR-003**: The `GET /auth` endpoint MUST establish a secure cookie-based session for the duration of the interactive login flow.
- **FR-004**: The `GET /auth` endpoint MUST redirect valid requests to the Astro frontend login page.
- **FR-005**: The Astro frontend MUST communicate with the backend using strictly typed Hono RPC, via direct client-side calls from the browser (with CORS and credentials).
- **FR-006**: The system MUST present a primary login form and, upon successful submission, a 2FA form (Simulated SMS OTP).
- **FR-007**: Upon successful 2FA completion, the backend MUST generate a single-use Authorization Code.
- **FR-008**: The generated Authorization Code MUST be securely linked to the `code_challenge` (PKCE) and DPoP key specified in the original PAR request.
- **FR-009**: The system MUST redirect the user back to the client's `redirect_uri` with `code` and `state` query parameters upon successful authorization.
- **FR-010**: The system MUST follow OIDC specifications for error handling by redirecting back with `error`, `error_description`, and `state` parameters when the client validation succeeds but the authorization fails.
- **FR-011**: If the `redirect_uri` or `client_id` is fundamentally invalid or missing, the system MUST display a generic error page hosted on the Astro frontend instead of redirecting back to the client (to prevent open redirect vulnerabilities).

### Key Entities

- **Client Application**: The relying party attempting to authenticate the user.
- **PAR Request**: The previously submitted authorization parameters, identified by the `request_uri`.
- **Auth Session**: A temporary, secure context tracking the user's progress through login and 2FA. (Stateful: Stored in SQLite via Drizzle ORM, referenced by a session ID in an HTTP-only cookie).
- **Authorization Code**: A short-lived, single-use token tied to PKCE and DPoP parameters, used by the client to request final tokens.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of successfully completed authentication flows result in a redirect to the correct `redirect_uri` containing a valid `code` and `state`.
- **SC-002**: 100% of the authorization endpoints (`/auth` and RPC paths) strictly conform to the path and body requirements detailed in `docs/singpass-server/03-authorization-endpoint.md`.
- **SC-003**: Attempting an authorization with an expired or invalid `request_uri` reliably returns an OIDC-compliant error redirect (or generic error page if the redirect URL is unsafe) 100% of the time.
- **SC-004**: End-to-end simulated login (initiation -> primary login -> simulated 2FA -> redirect) completes without session dropouts or validation mismatches.