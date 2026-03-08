# Research: OIDC Authorization Endpoint and Login Flow

## Overview
This document outlines the findings and decisions for implementing the OIDC Authorization Endpoint (`GET /auth`) and the subsequent interactive login flow within the Astro frontend and Hono backend.

## Addressed Clarifications and Decisions

### 1. Secure Auth Session Storage
**Decision**: Stateful sessions stored in SQLite using Drizzle ORM, referenced by a secure, HTTP-only cookie.
**Rationale**: Enables robust state tracking across multiple steps (login -> 2FA), aligning with the strict session expiry tied to the initial PAR request's `expires_in`.
**Alternatives considered**: Stateless JWTs. Rejected because server-side invalidation and exact mirroring of PAR state is simpler and safer with a persistent backend state.

### 2. 2FA (SMS OTP) Simulation
**Decision**: Generate a random 6-digit OTP, store it in the session DB, and log it to the backend console as well as display it as a hint in the UI during local development.
**Rationale**: Allows for realistic testing of the 2FA submission flow without integrating a real SMS provider.

### 3. Frontend-Backend RPC Communication
**Decision**: The Astro frontend will use client-side fetch calls, relying on Hono's RPC client, with CORS and `credentials: 'include'` enabled.
**Rationale**: Since Astro is configured for SSG, dynamic interactions (login, 2FA submission) must happen client-side using Svelte components.

### 4. Handling Invalid Authorization Requests
**Decision**: If `client_id` or `request_uri` is invalid/expired, and we cannot safely redirect to the `redirect_uri` (or if it is missing), we display a generic error page hosted on the Astro frontend.
**Rationale**: Prevents open redirect vulnerabilities.

### 5. Handling Unexpected Server Errors
**Decision**: Use a standard OIDC error code (e.g. 'server_error' or 'access_denied') in the redirect parameters.
**Rationale**: Adheres to OIDC standards, allowing the relying party to handle the error properly.

### 6. Handling Session Expiration
**Decision**: Redirect to `redirect_uri` with OIDC error parameters (e.g., `error=access_denied&error_description=session_expired`).
**Rationale**: Adheres to OIDC standards and ensures the client application is informed of the timeout.

### 7. Handling Invalid Redirect URIs
**Decision**: Display a generic "Invalid Request" error page hosted on the Astro frontend.
**Rationale**: Prevents open redirect vulnerabilities by refusing to redirect to an untrusted URI.

### 8. OIDC Code Generation
**Decision**: Upon successful 2FA, generate a short-lived authorization code tied directly to the PKCE `code_challenge` and `dpop_jkt` originally stored in the PAR request.
**Rationale**: Strictly adheres to FAPI 2.0 and OIDC specifications.