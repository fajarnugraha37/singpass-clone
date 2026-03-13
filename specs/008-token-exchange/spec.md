# Feature Specification: FAPI 2.0 Token Exchange Endpoint

**Feature Branch**: `008-token-exchange`  
**Created**: 2026-03-13  
**Status**: Draft  

## Clarifications

### Session 2026-03-13
- Q: What is the preferred format for the access_token? → A: Opaque String
- Q: Should the id_token be encrypted (JWE) as well as signed (JWS)? → A: Mandatory JWE (Encrypted using client's public encryption key)

### Session 2026-03-14
- Q: What are the defined lifetimes for Access and Refresh Tokens? → A: AT: 1 hour / RT: 24 hours
- Q: Should the system implement Refresh Token Rotation? → A: Yes (New RT issued, old RT invalidated immediately)
- Q: What is the storage mechanism for Access/Refresh Tokens and their DPoP binding? → A: Database (Bind Token to DPoP JKT)
- Q: What happens if a refresh token is reused? → A: Revoke all tokens (Full Family Revocation)
- Q: What is the refresh token update policy? → A: New RT on every use (Rotation)

$!{before} *(mandatory)*

### User Story 1 - Client securely exchanges authorization code for tokens (Priority: P1)

As a registered client application, I want to exchange a short-lived authorization code for an ID token, an access token, and a refresh token, so that I can securely retrieve user identity, access required APIs, and maintain access without frequent re-authentication.

**Why this priority**: This is the critical core path for OAuth2/OIDC token generation allowing clients to complete authentication workflows.

**Independent Test**: Can be fully tested by simulating a valid POST request to `/token` with required headers (DPoP), valid assertion (private_key_jwt), and valid code with PKCE.

**Acceptance Scenarios**:

1. **Given** a valid authorization code, stored code challenge, correct `dpop_jkt`, and valid `client_assertion`
   **When** the client submits a POST request to `/token` with `grant_type=authorization_code`
   **Then** the endpoint returns a 200 OK with a signed `id_token`, a DPoP-bound `access_token`, a `refresh_token`, and the appropriate FAPI headers.
2. **Given** an invalid or expired `client_assertion`
   **When** the client attempts to exchange the code
   **Then** the endpoint rejects the request with an `invalid_client` error according to FAPI 2.0 format.
3. **Given** an invalid DPoP proof or a mismatched `dpop_jkt`
   **When** the client attempts to exchange the code
   **Then** the endpoint rejects the request with an `invalid_dpop_proof` error.

---

### Edge Cases

- What happens when a code is reused or replayed? (Must invalidate the previously issued tokens linked to the code).
- **Refresh Token Rotation & Reuse Detection**: Each refresh request MUST result in a new refresh token being issued, with the previous refresh token immediately invalidated. If a used refresh token is presented again (reuse detection), the entire token family MUST be revoked, including all current access tokens issued in that session.
- How does the system handle missing headers or unsupported grant types? (Should gracefully return an `invalid_request` or `unsupported_grant_type` error).
- How are unexpected server errors handled to ensure no internal secrets or stack traces are leaked?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST implement a `POST /token` endpoint supporting only `grant_type=authorization_code`.
- **FR-002**: The system MUST validate the `client_assertion` parameter using `private_key_jwt` authentication method.
- **FR-003**: The system MUST validate the provided `code_verifier` against the `code_challenge` previously stored during the authorization request.
- **FR-004**: The system MUST validate the DPoP proof header and verify it against the `dpop_jkt` bound to the authorization code.
- **FR-005**: The system MUST generate and return a properly signed `id_token`, a DPoP-bound `access_token` (1h), and a `refresh_token` (24h) upon successful validation.
- **FR-006**: The system MUST return formatted errors compliant with FAPI 2.0 specifications (`invalid_request`, `invalid_client`, `invalid_grant`, `invalid_dpop_proof`).
- **FR-007**: The system MUST NOT log any sensitive secrets, tokens, or private keys under any circumstances.
- **FR-008**: The system MUST apply comprehensive input validation to prevent injection or malformed requests.

### Key Entities

- **Client Session / Authorization Code**: Represents the intermediate state holding the PKCE challenge, DPoP JKT, and expiration.
- **Access Token**: An opaque string (1h duration), bound to a DPoP key's thumbprint (`jkt`), requiring a database lookup for introspection and validation.
- **Refresh Token**: A long-lived (24h) opaque string, also bound to a DPoP key's thumbprint (`jkt`), with rotation enforcement.
- **Token Store**: Database-backed persistence ensuring tokens are uniquely linked to a client identity and its specific DPoP key.
- **ID Token**: A signed (JWS) and then encrypted (JWE) identity assertion verifying the authenticated user.
- **DPoP Proof**: The HTTP header proving possession of the private key corresponding to the public key.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of invalid token exchange attempts (bad PKCE, bad DPoP, bad assertion, reuse) are rejected with correct FAPI 2.0 error codes.
- **SC-002**: Successful token exchanges result in valid, cryptographically verifiable ID Tokens, DPoP-bound Access Tokens, and Refresh Tokens in under 300ms.
- **SC-003**: Security audits confirm zero leakage of sensitive data (assertions, tokens, challenges) in application logs.