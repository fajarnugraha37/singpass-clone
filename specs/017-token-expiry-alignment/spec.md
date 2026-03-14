# Feature Specification: Access Token Expiry Alignment

**Feature Branch**: `017-token-expiry-alignment`  
**Created**: 2026-03-15  
**Status**: Draft  
**Input**: User description: "Access Token Expiry Alignment **Finding**: #6 (🟡 Medium) **Branch Suggestion**: `fix/token-expiry-alignment` ### Problem `expires_in` in the token response is `3600` (1 hour) but the Singpass doc specifies 30 minutes (1800 seconds). ### Acceptance Criteria 1. `expires_in` in the token response MUST be `1800`. 2. Access tokens MUST expire 30 minutes after issuance. 3. The value MUST be configurable via `sharedConfig.SECURITY`."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Standard Token Issuance (Priority: P1)

As a relying party (client application), I want to receive an access token that is valid for 30 minutes so that I comply with Singpass security specifications.

**Why this priority**: Correct token lifespan is a hard requirement for Singpass integration and security compliance.

**Independent Test**: Can be tested by performing a token exchange and inspecting the `expires_in` field in the response.

**Acceptance Scenarios**:

1. **Given** a valid authorization code, **When** the client exchanges it for tokens, **Then** the `expires_in` value in the JSON response MUST be exactly `1800`.
2. **Given** a successful token response, **When** the `expires_in` value is present, **Then** it MUST represent a duration of 30 minutes in seconds.

---

### User Story 2 - Token Expiration Enforcement (Priority: P2)

As a security-conscious system, I want access tokens to become invalid exactly 30 minutes after they are issued to limit the window of opportunity for token misuse.

**Why this priority**: Ensuring the token actually expires is critical for enforcing the security policy described in the specifications.

**Independent Test**: Can be tested by issuing a token and attempting to use it at the UserInfo endpoint after 30 minutes.

**Acceptance Scenarios**:

1. **Given** an access token issued 31 minutes ago, **When** a request is made to a protected resource (e.g., UserInfo), **Then** the request MUST be rejected with an "invalid_token" error.
2. **Given** an access token issued 29 minutes ago, **When** a request is made to a protected resource, **Then** the request MUST be accepted (assuming other validations pass).

---

### User Story 3 - Configurable Expiry (Priority: P3)

As a system administrator, I want to be able to change the access token lifespan via configuration so that the system can adapt to different security requirements without code changes.

**Why this priority**: Flexibility in security configuration is a core architectural requirement for Vibe-Auth.

**Independent Test**: Can be tested by changing the security configuration and verifying that the `expires_in` value in the token response changes accordingly.

**Acceptance Scenarios**:

1. **Given** the security configuration for access token lifespan is set to `900`, **When** a new token is issued, **Then** the `expires_in` value MUST be `900`.
2. **Given** no explicit configuration is provided, **When** a token is issued, **Then** the system MUST default to `1800` (Singpass standard).

### Edge Cases

- **Boundary Condition**: What happens exactly at the 1800-second mark? (System should allow a small clock-skew grace period if applicable, but strictly enforce the 1800s limit).
- **Configuration Error**: How does the system handle an invalid or negative expiry value in the configuration? (Should fallback to the safe default of 1800).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST return `expires_in: 1800` in the token response by default.
- **FR-002**: ID Tokens MUST contain an `exp` claim that is exactly 1800 seconds after the `iat` (issued at) time by default. Access Tokens MUST have associated expiration metadata in the persistence layer matching this duration.
- **FR-003**: The protected resource endpoints MUST validate the token expiration and reject expired tokens.
- **FR-004**: The access token lifespan MUST be configurable via `sharedConfig.SECURITY.ACCESS_TOKEN_LIFESPAN` (or similar project-standard path).
- **FR-005**: If the configuration is missing or invalid, the system MUST default to 1800 seconds.

### Key Entities *(include if feature involves data)*

- **Access Token**: A JWT or opaque string representing the authorization, including its issuance and expiration timestamps.
- **Security Configuration**: A set of parameters that define the behavior of the auth server, specifically the `ACCESS_TOKEN_LIFESPAN`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of issued access tokens have an `expires_in` value of 1800 in the response (unless configured otherwise).
- **SC-002**: Protected resource requests using tokens older than 1800 seconds are rejected with 100% accuracy.
- **SC-003**: System administrators can update the token lifespan in under 1 minute via a configuration file update.
- **SC-004**: The system maintains 100% availability while enforcing the new 30-minute rotation policy.
