# Feature Specification: UserInfo Endpoint

**Feature Branch**: `009-userinfo-endpoint`  
**Created**: 2026-03-14  
**Status**: Draft  
**Input**: User description: "Implement the UserInfo endpoint. Goal: Implement the UserInfo endpoint to return user data based on requested scopes. Git branch: 009-userinfo-endpoint Context Files: docs/singpass-server/05-userinfo-endpoint.md Requirements: 1. Implement GET /userinfo endpoint. 2. Validate the Authorization header containing the Authorization header containing the DPoP-bound access token. 3. Validate the DPoP proof header against the token's bound jkt. 4. Decrypt, verify, and return the person_info claims according to the scopes requested. 5. Follow strict error handling protocols."

## Clarifications

### Session 2026-03-14

- Q: Where does the user identity data originate for this endpoint? → A: Local Database: Data is retrieved from the project's internal persistence layer (populated during authentication).
- Q: What should the final response structure look like to the client? → A: Complete JWT: A JWS (signed) nested inside a JWE (encrypted). The response body is a raw JWE string.
- Q: Which algorithm should be used for the JWS signature? → A: ES256: ECDSA using P-256 and SHA-256 (Standard for Singpass/FAPI).
- Q: Which algorithms should be used for Key Encryption (alg) and Content Encryption (enc)? → A: ECDH-ES+A256KW / A256GCM: Modern elliptic curve key agreement with AES-GCM for content.
- Q: How should the user claims be organized within the JWT payload? → A: Nested: Claims are grouped under a `person_info` top-level key, following the exact Singpass structure defined in documentation.
- Q: How should the system retrieve the **Client's public encryption key** required for FR-008? → A: JWKS URI: System fetches the key from the client's `jwks_uri` endpoint.
- Q: Should the UserInfo endpoint support **POST** requests in addition to the specified GET? → A: Both GET and POST: Allow both for maximum OIDC compatibility.
- Q: What level of **audit logging** is required for UserInfo requests? → A: Detailed Audit: Log subject, client ID, success/failure, and reason (no claims).
- Q: How should the system handle cases where a user has **no data** for the authorized scopes? → A: Empty person_info: Return 200 OK with an empty or minimal `person_info` object.
- Q: Should the system enforce **DPoP jti (JWT ID)** validation to prevent replay attacks? → A: Enforce Strict: Validate `jti` uniqueness within a short time window (e.g., 5 min).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Successful Identity Retrieval (Priority: P1)

As a Client Application, I want to retrieve the authenticated user's profile information so that I can personalize the user experience and verify their identity details.

**Why this priority**: This is the core functionality of the UserInfo endpoint and a fundamental part of the OIDC flow for identity providers.

**Independent Test**: Can be fully tested by sending a valid DPoP-bound access token and proof to the `/userinfo` endpoint and receiving a valid, encrypted JWE response containing user claims.

**Acceptance Scenarios**:

1. **Given** a valid access token bound to a specific public key (jkt), **When** a GET or POST request is made to `/userinfo` with a valid DPoP proof signed by the corresponding private key, **Then** the system returns a 200 OK response with a JWE-encrypted payload.
2. **Given** a successful decryption of the response, **When** inspecting the payload, **Then** it contains the `sub` claim and authorized user attributes (e.g., name, email) nested within a `person_info` object as per Singpass standards.

---

### User Story 2 - Secure Token Validation (Priority: P2)

As a Security Administrator, I want the UserInfo endpoint to strictly validate DPoP bindings so that stolen access tokens cannot be used by unauthorized parties.

**Why this priority**: DPoP (Demonstrating Proof-of-Possession) is a critical security requirement for FAPI-compliant and Singpass-like implementations to prevent token injection/replay.

**Independent Test**: Can be tested by attempting to access the endpoint with a valid token but an invalid or missing DPoP proof, and verifying that the request is rejected.

**Acceptance Scenarios**:

1. **Given** a valid access token, **When** a request is made without a `DPoP` header, **Then** the system returns a 401 Unauthorized response.
2. **Given** a valid access token bound to Key A, **When** a request is made with a valid DPoP proof signed by Key B, **Then** the system returns a 401 Unauthorized response with an `invalid_dpop_proof` error.

---

### User Story 3 - Scoped Data Access (Priority: P3)

As a Privacy Officer, I want the UserInfo endpoint to return only the specific user data authorized by the granted scopes so that user privacy is protected.

**Why this priority**: Ensures adherence to the principle of least privilege and data minimization.

**Independent Test**: Can be tested by requesting UserInfo with different authorized scope sets and verifying that only the relevant claims are included in the response.

**Acceptance Scenarios**:

1. **Given** an access token authorized only for the `openid` scope, **When** requesting UserInfo, **Then** the response contains the `sub` claim but no extended profile attributes.
2. **Given** an access token authorized for `openid profile`, **When** requesting UserInfo, **Then** the response contains profile attributes like name and picture.

---

### Edge Cases

- **Token Expiration**: Accessing the endpoint with a token that was valid at the time of issuance but has since expired.
- **Clock Skew**: Handling DPoP proofs with `iat` (issued at) times slightly in the future or past due to server clock differences.
- **Revoked Keys**: Handling cases where the client's public encryption key has been rotated or revoked.
- **Missing User Data**: Gracefully handling scenarios where requested claims are missing from the user's profile by returning a 200 OK with an empty `person_info` object.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide `GET /userinfo` and `POST /userinfo` endpoints accessible via HTTPS.
- **FR-002**: System MUST validate the `Authorization: DPoP <token>` header.
- **FR-003**: System MUST validate the `DPoP` proof JWT according to RFC 9449, including checking the `htm` (matching GET or POST), `htu` (URL), and `jti` (JWT ID) claims.
- **FR-004**: System MUST enforce `jti` uniqueness for DPoP proofs within a configurable time window (e.g., 5 minutes) to prevent replay attacks.
- **FR-005**: System MUST verify that the access token's `cnf.jkt` claim matches the thumbprint of the public key used in the DPoP proof.
- **FR-004**: System MUST verify that the access token's `cnf.jkt` claim matches the thumbprint of the public key used in the DPoP proof.
- **FR-006**: System MUST retrieve user identity attributes from the **local database** (populated during authentication) based on the `sub` and `scopes` associated with the access token. If no attributes match the requested scopes, an empty `person_info` object MUST be returned.
- **FR-007**: System MUST return the UserInfo response as a **raw JWE string** (nested JWS inside JWE) containing a **nested `person_info` object** for identity claims.
- **FR-008**: System MUST sign the UserInfo payload using the server's private **ES256** key (JWS).
- **FR-009**: System MUST encrypt the resulting JWS using the Client's public encryption key retrieved from their **`jwks_uri`** via **ECDH-ES+A256KW** with **A256GCM** for content encryption (JWE).
- **FR-010**: System MUST return 401 Unauthorized with appropriate error codes (`invalid_token`, `invalid_dpop_proof`) for validation failures.
- **FR-011**: System MUST record a detailed audit log for every UserInfo request, including client ID, subject, request status, and failure reason (if applicable), excluding actual claim values.

### Key Entities *(include if feature involves data)*

- **Access Token**: Represents the authorization grant, containing the subject (user), scopes, and the public key binding (jkt).
- **DPoP Proof**: A short-lived JWT created by the client to prove possession of the private key bound to the access token.
- **User Identity (Subject)**: The entity whose information is being retrieved from the local database.
- **Client Encryption Key**: The public key used to ensure the confidentiality of the UserInfo response.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of UserInfo requests with valid DPoP-bound tokens and proofs return the correct user data.
- **SC-002**: Requests with invalid or unbound DPoP proofs are rejected with a 401 status in less than 150ms on average.
- **SC-003**: The response payload is a valid JWE structure that can be decrypted only by the intended client.
- **SC-004**: Zero sensitive user data is leaked to unauthorized callers or logged in cleartext.
