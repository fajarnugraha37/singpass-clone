# Feature Specification: FAPI 2.0 Token Exchange Endpoint

**Feature Branch**: `011-token-exchange`  
**Created**: 2026-03-11  
**Status**: Draft  
**Input**: User description: "Implement the FAPI 2.0 Token Exchange endpoint mirroring Singpass exactly. Goal: Implement the secure endpoint for clients to exchange codes for tokens. Context Files: docs/singpass-server/04-token-endpoint.md Requirements: 1. Implement POST /token handling grant_type=authorization_code. 2. Validate the client_assertion (private_key_jwt). 3. Validate the code_verifier against the stored code_challenge (PKCE). 4. Validate the DPoP header proof against the dpop_jkt bound to the authorization code. 5. On success, issue a signed id_token and a DPoP-bound access_token. 6. Follow strict FAPI 2.0 error response formatting (invalid_request, invalid_client, invalid_dpop_proof, etc.). 7. Apply comprehensive input validation, error handling, and unit tests. Secrets must never be logged."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Client Application Token Exchange (Priority: P1)

As a relying party (client application), I want to exchange an authorization code for an ID token and access token, so that I can cryptographically verify the user's identity and make secure API requests on their behalf.

**Why this priority**: This is the core functionality of the OIDC/FAPI authorization flow. Without this step, the client cannot authenticate the user or consume the protected APIs.

**Independent Test**: Can be fully tested by submitting a valid `POST /token` request containing a valid authorization code, PKCE code verifier, client assertion JWT, and DPoP proof. The response should contain `access_token` and `id_token` in a JSON payload.

**Acceptance Scenarios**:

1. **Given** a valid authorization code generated from the auth endpoint, **When** the client sends a `POST /token` request with valid PKCE, DPoP, and `private_key_jwt` credentials, **Then** the system returns a 200 OK with the requested tokens.
2. **Given** a valid token exchange request, **When** processing succeeds, **Then** the returned `access_token` is properly bound to the DPoP key provided in the request header.

---

### User Story 2 - Strict Validation and Error Handling (Priority: P1)

As an authorization server, I want to strictly validate all incoming claims, proofs, and assertions during the token exchange, so that malicious actors cannot steal or forge tokens.

**Why this priority**: FAPI 2.0 demands high security. Correct handling of cryptographic failures and replay attacks is just as critical as the happy path.

**Independent Test**: Can be tested by sending various purposefully malformed requests (e.g., incorrect PKCE, invalid DPoP signatures, expired client assertions) and validating that the system rejects them with the standardized error code format.

**Acceptance Scenarios**:

1. **Given** a request with an invalid or expired `client_assertion`, **When** the endpoint processes it, **Then** the system returns a 401 Unauthorized with the `invalid_client` error.
2. **Given** a request where the `code_verifier` does not match the stored `code_challenge`, **When** the endpoint processes it, **Then** the system returns a 400 Bad Request with the `invalid_grant` error.
3. **Given** a request where the DPoP `jkt` does not match the one bound to the code, **When** the endpoint processes it, **Then** the system returns an error such as `invalid_dpop_proof`.

---

### Edge Cases

- What happens if the same `authorization_code` is submitted more than once (replay attack)? The system should reject the request and optimally revoke any tokens previously issued with that code.
- What happens if the `redirect_uri` provided in the request does not exactly match the one used during the initial authorization/PAR step?
- How does the system handle clock skew when validating `iat` and `exp` claims on the `client_assertion` and DPoP proof?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST expose a `POST` endpoint (e.g., `/token`) that accepts `application/x-www-form-urlencoded` payloads and handles the `grant_type=authorization_code` flow.
- **FR-002**: System MUST validate client authentication using the `private_key_jwt` method (`client_assertion_type` and `client_assertion`).
- **FR-003**: System MUST enforce PKCE by computing the SHA-256 hash of the `code_verifier` and comparing it to the stored `code_challenge`.
- **FR-004**: System MUST parse and validate the `DPoP` header, extracting the JWK Thumbprint (`jkt`) and verifying it against the `dpop_jkt` bound to the authorization code.
- **FR-005**: System MUST ensure the provided `redirect_uri` exactly matches the URI registered/used during the prior PAR phase.
- **FR-006**: System MUST issue a DPoP-bound `access_token` and a signed `id_token` (JWS) containing required claims (e.g., `sub`, `aud`, `iss`, `nonce`, `acr`, `amr`) upon successful validation.
- **FR-007**: System MUST support issuing the `id_token` as either a signed-only JWS or an encrypted JWE, depending on the client's registered preferences.
- **FR-008**: System MUST format all error responses strictly according to FAPI 2.0 / RFC 6749 specifications (e.g., returning `invalid_request`, `invalid_client`, `invalid_grant`, `invalid_dpop_proof` as appropriate).
- **FR-009**: System MUST absolutely never log sensitive secrets, tokens, or private key material, even in verbose debugging modes.

### Key Entities

- **Authorization Code**: The single-use code being exchanged, which holds references to the `code_challenge`, `redirect_uri`, `client_id`, and `dpop_jkt`.
- **Client Assertion**: The Private Key JWT used to authenticate the requesting client.
- **DPoP Proof**: The JWT provided in the HTTP header proving possession of the private key corresponding to the public key to which the access token will be bound.
- **Access Token**: The issued artifact, formatted typically as a JWT, containing DPoP bindings.
- **ID Token**: The OIDC token asserting the user's identity and authentication event details.

### Dependencies and Assumptions

- **Pushed Authorization Request (PAR)**: It is assumed that the client has already completed the PAR flow and that the authorization code submitted was issued via the resulting authorization flow.
- **Client JWKS**: The system relies on having access to the client's public JWKS to verify `client_assertion` signatures and, if applicable, to encrypt the `id_token`.
- **Singpass Interoperability**: The endpoint aims to perfectly match the strict format and validations required by Singpass as an external identity provider model.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of valid, well-formed token exchange requests successfully result in the issuance of strictly compliant access and ID tokens.
- **SC-002**: 100% of test cases mimicking invalid requests (e.g., bad PKCE, expired tokens, signature mismatches) are properly rejected with standardized error codes.
- **SC-003**: The endpoint securely processes cryptographic verifications (DPoP, JWT signatures) with a p95 latency under an acceptable threshold (e.g., <200ms).
- **SC-004**: Automated security scanning and log audits confirm zero occurrences of secrets or PII being leaked in system logs.