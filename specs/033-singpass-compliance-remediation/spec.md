# Feature Specification: Singpass Compliance Remediation

**Feature Branch**: `033-singpass-compliance-remediation`  
**Created**: 2026-03-18  
**Status**: Draft  
**Input**: User description: "Compliance Audit Report findings for Singpass Products (Login & MyInfo)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Transparent Consent with Purpose Limitation (Priority: P1)

As a User, I want to see a clear explanation of why my data is being requested so that I can make an informed decision when providing consent.

**Why this priority**: Compliance with Singpass MyInfo "Purpose Limitation" and PDPA requirements. Failure to show the purpose is a high compliance risk.

**Independent Test**: Can be verified by initiating a login flow with a `purpose` string provided by the Relying Party and confirming it appears correctly on the consent screen.

**Acceptance Scenarios**:

1. **Given** a Relying Party initiates a Pushed Authorization Request (PAR) with a `purpose` string, **When** the User reaches the consent screen, **Then** the User MUST see the specific `purpose` string displayed prominently.
2. **Given** a PAR request is made WITHOUT a `purpose` string, **When** the system validates the request, **Then** it MUST reject the request with an appropriate OAuth2 error.

---

### User Story 2 - Secure Token Exchange with DPoP-Nonce (Priority: P1)

As a Security-Conscious Developer, I want the system to protect token requests from replay attacks using server-signed nonces to ensure full compliance with FAPI 2.0 / DPoP as implemented by Singpass.

**Why this priority**: DPoP replay protection is a critical security requirement in FAPI 2.0.

**Independent Test**: Can be verified by performing a DPoP-bound token request and checking for the `DPoP-Nonce` header in the response, then ensuring the next request uses that nonce.

**Acceptance Scenarios**:

1. **Given** a client makes a DPoP-bound PAR or Token request, **When** the server responds, **Then** it MUST include a `DPoP-Nonce` header.
2. **Given** a client makes a subsequent request with a DPoP proof, **When** the server validates the proof, **Then** it MUST verify that the `nonce` claim in the proof matches the expected server-signed nonce.

---

### User Story 3 - Verified Data Integrity in MyInfo Attributes (Priority: P2)

As a Relying Party, I want to receive standard metadata (source, classification, lastupdated) for each MyInfo attribute so that I can accurately identify government-verified data and enforce "Display As-Is" principles.

**Why this priority**: High-fidelity simulation of Singpass MyInfo responses.

**Independent Test**: Can be verified by calling the UserInfo endpoint and inspecting the returned JSON for the presence of `source`, `classification`, and `lastupdated` fields for each attribute.

**Acceptance Scenarios**:

1. **Given** a successful UserInfo request, **When** the UserProfile is returned, **Then** each attribute MUST contain `value`, `source`, `classification`, and `lastupdated` fields.
2. **Given** a mock database with seeded user data, **When** the UserInfo is mapped, **Then** the `source` field MUST reflect whether the data is government-verified ("1") or user-provided ("4").

---

### User Story 4 - Privacy-Preserving Subject Identification (Priority: P1)

As a User, I want my digital identity to be uniquely identified using a UUID instead of my NRIC in the `sub` claim so that my personal identification number is not exposed unnecessarily to digital services.

**Why this priority**: Critical privacy requirement and protocol compliance. Returning NRIC directly in `sub` is deprecated by Singpass.

**Independent Test**: Can be verified by inspecting the ID Token's `sub` claim and confirming it is a UUID (formatted string) and NOT an NRIC (starting with S/T/F/G).

**Acceptance Scenarios**:

1. **Given** a successful authentication flow, **When** an ID Token is generated, **Then** the `sub` claim MUST be the user's persistent UUID from the database.
2. **Given** multiple logins for the same user, **When** ID Tokens are issued, **Then** the `sub` claim MUST remain consistent (same UUID).

### Edge Cases

- **Purpose Overflow**: How does the system handle an excessively long `purpose` string? (Recommend truncation or character limits).
- **Nonce Expiry**: What happens when a `DPoP-Nonce` expires between the server response and the client's next request? (Server should return a fresh nonce and the client should retry).
- **Missing Metadata in DB**: How does the mapper handle attributes that have no metadata in the seed data? (Use reasonable defaults or omit if safe).
- **Multiple Concurrent Nonces**: Does the server support multiple active nonces per session or client? (Recommend one active nonce per response).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST accept and validate a `purpose` parameter in the PAR endpoint according to the `parRequestSchema`.
- **FR-002**: System MUST store the `purpose` alongside the PAR state in the database.
- **FR-003**: System MUST display the stored `purpose` on the User consent UI during the authorization flow.
- **FR-004**: System MUST generate a cryptographically secure, server-signed `DPoP-Nonce` for all DPoP-enabled endpoints.
- **FR-005**: System MUST include the `DPoP-Nonce` in the HTTP response headers for PAR and Token endpoints.
- **FR-006**: System MUST validate that the `nonce` claim in the DPoP proof matches the server-signed nonce if one has been provided.
- **FR-007**: System MUST map all MyInfo person attributes to include `source`, `classification`, and `lastupdated` metadata.
- **FR-008**: System MUST use the database-generated UUID as the `sub` claim in all ID Tokens instead of the raw NRIC/FIN.
- **FR-009**: System MUST ensure that the `ValidateLoginUseCase` sets the `session.userId` to the user's UUID from the database record.

### Key Entities *(include if feature involves data)*

- **PushedAuthorizationRequest**: Updated to include a `purpose` string field.
- **MyinfoPerson**: Updated to include metadata fields for each person attribute.
- **User**: The central entity whose `id` (UUID) is now the primary identifier for `sub` claims.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% compliance with Singpass MyInfo "Purpose Limitation" principle by presenting the requested purpose to the user.
- **SC-002**: 100% reduction in NRIC leakage via the `sub` claim in ID tokens.
- **SC-003**: 100% of MyInfo response attributes include `source`, `classification`, and `lastupdated` metadata.
- **SC-004**: Successfully blocking 100% of DPoP replay attacks that attempt to use an invalid or expired nonce.
- **SC-005**: All core compliance findings from the Audit Report are remediated and verified through tests.
