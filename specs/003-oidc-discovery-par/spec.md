# Feature Specification: OIDC Discovery and PAR Endpoint Implementation

**Feature Branch**: `003-oidc-discovery-par`  
**Created**: 2026-03-08  
**Status**: Draft  
**Input**: User description: "Implement the OIDC Discovery and PAR (Pushed Authorization Request) endpoints mirroring Singpass exactly. Context Files: docs/singpass-server/01-openid-discovery.md, docs/singpass-server/02-pushed-authorization-request.md Requirements: 1. Implement GET /.well-known/openid-configuration returning the exact JSON structure of Singpass FAPI 2.0. 2. Implement GET /.well-known/keys to serve the public keys. 3. Implement POST /par (Pushed Authorization Request): - Validate client_assertion (JWT) and client_assertion_type. - Validate PKCE (code_challenge, code_challenge_method=S256). - Validate DPoP header or dpop_jkt. - Validate Singpass-specific parameters (authentication_context_type). - Store the request payload in SQLite and return a request_uri and expires_in (60s). 4. Add strict input validation and unit tests with >80% coverage."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - System Discovery Configuration (Priority: P1)

Client applications need to automatically discover the authentication system's configuration and public keys so that they can properly configure their integration without manual setup.

**Why this priority**: Fundamental to allowing clients to seamlessly integrate with the system; without it, clients must hardcode configurations.

**Independent Test**: Can be fully tested by verifying that any unauthenticated HTTP client can retrieve the exact configuration format and public keys expected by the standard.

**Acceptance Scenarios**:

1. **Given** a client application querying the configuration endpoint, **When** it requests the discovery document, **Then** it receives the complete, standard-compliant configuration metadata.
2. **Given** a client application querying the keys endpoint, **When** it requests the public keys, **Then** it receives the public key material needed to verify tokens.

---

### User Story 2 - Secure Authorization Initiation (Priority: P1)

Client applications need a secure way to pre-register their authorization requests (PAR) directly with the server so that sensitive parameters are not exposed or tampered with in the user's browser.

**Why this priority**: Crucial for high-security environments; prevents parameter interception and ensures the integrity of the authorization request.

**Independent Test**: Can be fully tested by simulating a secure server-to-server request with valid and invalid security credentials, validating that only authorized clients receive a one-time reference URI.

**Acceptance Scenarios**:

1. **Given** an authorized client application, **When** it submits a complete and correctly signed authorization request, **Then** it receives a temporary, single-use reference identifier with a short lifespan.
2. **Given** an unauthorized or improperly configured client application, **When** it submits a request with missing or invalid credentials, **Then** the request is explicitly rejected.

---

### Edge Cases

- What happens when a client submits an authorization request with an expired assertion token?
- How does the system handle an authorization request that is missing required security protections (e.g., missing proof-of-possession headers)?
- What happens if the generated reference identifier expires before the user acts upon it?
- How does the system handle malformed or oversized payloads during pre-registration?

## Clarifications

- Q: For failed PAR requests (e.g., invalid assertions or signature mismatch), should we log the full request payload (masked) for forensics, or only the error code and client identifier? → A: Minimal logging: Capture only the error type, timestamp, and client_id.
- Q: What is the expected volume of concurrent pre-registration requests, and does the 60-second expiry require an active cleanup process, or is it sufficient to rely on row-level TTL/passive expiration given SQLite's capabilities? -> A: Moderate volume; passive cleanup (e.g., TTL-based queries or periodic cron) is sufficient

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST expose a publicly accessible discovery endpoint that provides standard configuration metadata (mirroring Singpass FAPI 2.0).
- **FR-002**: The system MUST expose a publicly accessible endpoint containing cryptographic public keys (JWKS).
- **FR-003**: The system MUST expose a secure endpoint for pre-registering authorization requests (PAR).
- **FR-004**: The system MUST validate the client's identity using `private_key_jwt` assertions (client_assertion) before accepting a PAR registration.
- **FR-005**: The system MUST enforce proof-of-possession and interception prevention by validating PKCE (`code_challenge` with S256) and DPoP headers on all PAR requests.
- **FR-006**: The system MUST securely store the pre-registered request and return a unique, single-use `request_uri` that expires within 60 seconds (enforced via passive TTL cleanup).
- **FR-008**: The system MUST perform strict Zod-based validation of all input parameters (e.g., `client_id` format, `redirect_uri` presence, `authentication_context_type` values).
- **FR-009**: The system MUST capture minimal audit logs for failed requests (error type, timestamp, and client_id) without storing full request payloads.
- **FR-010**: The system MUST implement `jti` replay protection for assertions by storing consumed IDs for 24 hours.
- **FR-011**: The system MUST bind the `request_uri` to the DPoP key thumbprint (`dpop_jkt`) provided in the header or body.
- **FR-012**: The system MUST implement DPoP-Nonce protection, returning a nonce in the PAR response and validating its freshness in subsequent requests.

### Key Entities

- **Discovery Configuration**: Metadata detailing supported authentication methods, endpoints, and security profiles.
- **Authorization Request**: A collection of parameters describing the client's request for user authentication, temporarily persisted until the user logs in.
- **Consumed JWT ID**: An entry in the jti store to prevent assertion replay, containing the ID, client identifier, and an expiration timestamp.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of required configuration metadata and public keys are accurately exposed and accessible without errors.
- **SC-002**: 100% of valid, authenticated pre-registration requests successfully receive a valid reference identifier.
- **SC-003**: 100% of invalid, malformed, or unauthenticated pre-registration requests are correctly rejected.
- **SC-004**: The system maintains high performance and correctly expires unused authorization requests after the defined lifespan.
- **SC-005**: The system achieves a high level of automated verification (e.g., >80% code coverage) across all new capabilities.
