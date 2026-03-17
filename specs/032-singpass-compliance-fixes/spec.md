# Feature Specification: Remediate Singpass Compliance Audit Findings

**Feature Branch**: `032-singpass-compliance-fixes`  
**Created**: 2026-03-18  
**Status**: Draft  
**Input**: User description: "Remediate Singpass compliance audit findings regarding NRIC sub claim, missing purpose, DPoP-Nonce, and MyInfo metadata."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Privacy-Preserving Identity (Priority: P1)

As a user, I want my identity to be protected by using a stable, unique identifier (UUID) instead of my NRIC in the ID tokens shared with digital services.

**Why this priority**: Protecting personally identifiable information (PII) like NRIC is a critical privacy requirement and a mandatory part of Singpass V5 migration.

**Independent Test**: Perform a login and inspect the ID token. The `sub` claim must be a UUID (e.g., `550e8400-e29b-41d4-a716-446655440000`) and NOT an NRIC (e.g., `S1234567A`).

**Acceptance Scenarios**:

1. **Given** a user logs in with their NRIC, **When** the ID token is generated, **Then** the `sub` claim MUST be the user's UUID from the database.
2. **Given** a session is established, **When** the `userId` is retrieved from the session, **Then** it MUST be a UUID.

---

### User Story 2 - Informed Consent for Data Access (Priority: P1)

As a user, I want to clearly understand the purpose for which my data is being requested so that I can provide informed consent.

**Why this priority**: Purpose transparency is a core principle of PDPA and Singpass MyInfo. Each request must support a single, clear purpose.

**Independent Test**: Initiate a PAR request without the `purpose` parameter. It must fail. Initiate with a purpose, and verify it appears on the consent screen.

**Acceptance Scenarios**:

1. **Given** a client initiates a PAR request, **When** the `purpose` parameter is missing or empty, **Then** the system MUST return a 400 Bad Request error.
2. **Given** a valid PAR request with a `purpose`, **When** the user reaches the consent page, **Then** the `purpose` text MUST be clearly displayed.

---

### User Story 3 - Secure API Communication with DPoP (Priority: P2)

As a security-conscious developer, I want the system to use server-signed nonces in DPoP proofs to prevent replay attacks.

**Why this priority**: FAPI 2.0 / DPoP requirements mandate fresh, server-bound proofs. This is a high-severity security finding.

**Independent Test**: Verify that the Token response contains a `DPoP-Nonce` header and that subsequent requests fail if they don't include this nonce in the DPoP proof.

**Acceptance Scenarios**:

1. **Given** a successful PAR or Token exchange, **When** the response is sent, **Then** it MUST include a `DPoP-Nonce` header.
2. **Given** a protected endpoint requires DPoP, **When** a DPoP proof is provided without the correct server nonce, **Then** the system MUST reject it with a 401 Unauthorized error and a new `DPoP-Nonce`.

---

### User Story 4 - High-Fidelity MyInfo Attributes (Priority: P3)

As a developer integrating with the mock server, I want to receive MyInfo attributes with full metadata (source, classification, lastupdated) so that I can test my application's logic for government-verified data.

**Why this priority**: Essential for realistic simulation of the Singpass MyInfo spec and enforcing the "Display As-Is" principle for verified data.

**Independent Test**: Call the UserInfo/MyInfo endpoint and verify the JSON structure of attributes.

**Acceptance Scenarios**:

1. **Given** a UserInfo request for MyInfo scopes, **When** attributes are returned, **Then** each attribute MUST contain `value`, `source`, `classification`, and `lastupdated` fields.
2. **Given** government-verified data in the mock database, **When** returned, **Then** the `source` field MUST be set to "1".

---

### Edge Cases

- **User lookup failure**: If a user logs in with an NRIC that is not found in the database (even if the credential is valid in some mock sense), the system must handle the missing UUID gracefully.
- **Malformed DPoP nonces**: System must handle expired or malformed nonces by issuing a new one rather than just failing.
- **Empty Purpose**: `purpose` must not be a whitespace-only string.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The authentication logic MUST lookup the user by their unique identifier (e.g., NRIC) and assign the persistent, stable internal identifier (UUID) for the user's session.
- **FR-002**: The token generation service MUST use the session's internal stable identifier for the `sub` claim in issued identity tokens.
- **FR-003**: The request validation schema for pushed authorization MUST include a mandatory `purpose` field.
- **FR-004**: The system MUST persist the `purpose` of the authorization request to be available during the consent phase.
- **FR-005**: The consent interface MUST retrieve and display the stored `purpose` of the authorization request to the user.
- **FR-006**: The authorization and token response logic MUST include a server-issued nonce for use in Proof-of-Possession (DPoP) flows.
- **FR-007**: The system MUST validate the presence and freshness of server-issued nonces within Proof-of-Possession proofs for protected endpoints.
- **FR-008**: The identity profile mapping MUST include standard metadata fields (source, classification, last-updated) for all user attributes.
- **FR-009**: The test data generation process MUST be updated to provide realistic metadata for user profiles to simulate a production environment.

### Key Entities *(include if feature involves data)*

- **Session**: Updated to store UUID as `userId` instead of NRIC.
- **PushedAuthorizationRequest**: Updated to include `purpose`.
- **MyInfo Attribute**: An object containing `value`, `source` (string), `classification` (string), and `lastupdated` (string).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of issued ID tokens use a UUID as the `sub` claim.
- **SC-002**: All PAR requests without a `purpose` parameter result in a 400 Bad Request.
- **SC-003**: 100% of responses from PAR and Token endpoints include a `DPoP-Nonce` header.
- **SC-004**: MyInfo responses contain the full metadata structure required by the Singpass MyInfo V5 specification.
- **SC-005**: System successfully rejects replayed DPoP proofs that lack a fresh server-signed nonce.

## Assumptions

- **Non-Singpass Alternative**: As this is a mock server, we assume the "Non-Singpass Alternative" finding is addressed by ensuring documentation or sample UI components exist for RPs to follow, but no technical changes are required for the OP core.
- **Database UUIDs**: We assume all users in the mock database already have a unique UUID assigned to them.
- **DPoP Signing Key**: The server has a stable key used for signing DPoP nonces.
