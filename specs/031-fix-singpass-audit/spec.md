# Feature Specification: Remediate Singpass Compliance Audit Findings

**Feature Branch**: `031-fix-singpass-audit`  
**Created**: Tuesday, 17 March 2026  
**Status**: Draft  
**Input**: Compliance Audit Report: Singpass Integration Guide (v5/FAPI 2.0)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Secure Pushed Authorization (Priority: P1)

As an RP (Relying Party), I want to initiate an authorization request securely so that I can comply with Singpass security standards and ensure high entropy for my session identifiers.

**Why this priority**: Core security and compliance requirement for the PAR flow.

**Independent Test**: Can be tested by sending a PAR request with short state/nonce (should fail) and observing the `request_uri` expiration (should be 60s).

**Acceptance Scenarios**:

1. **Given** an RP initiation, **When** the PAR request contains a `state` or `nonce` shorter than 30 characters, **Then** the system MUST return a validation error.
2. **Given** a successful PAR response, **When** the RP attempts to use the `request_uri` after 60 seconds, **Then** the authorization server MUST reject the request as expired.
3. **Given** a PAR request, **When** the system processes the request, **Then** it MUST return a `DPoP-Nonce` header in the response.

---

### User Story 2 - Fresh DPoP-bound Token Exchange (Priority: P1)

As an RP, I want to exchange an authorization code for tokens using DPoP with server-provided nonces so that my tokens are cryptographically bound and protected against replay attacks.

**Why this priority**: High-severity security finding; required by FAPI 2.0 for token freshness.

**Independent Test**: Can be tested by performing a Token request and verifying that the server requires a fresh `DPoP-Nonce` if one was previously issued.

**Acceptance Scenarios**:

1. **Given** a Token request with DPoP, **When** the server responds, **Then** it MUST include a `DPoP-Nonce` header.
2. **Given** a server-issued `DPoP-Nonce`, **When** the RP makes a subsequent DPoP-bound request without the expected nonce, **Then** the server MUST return a 401 error with `WWW-Authenticate: DPoP error="use_dpop_nonce"`.
3. **Given** a valid `DPoP-Nonce` in the DPoP proof, **When** the RP makes the request, **Then** the server MUST accept the proof and process the token exchange.

---

### User Story 3 - Accurate User Identity Attributes (Priority: P2)

As a user, I want my account type (Singapore standard vs Foreign) to be correctly reflected in my identity token so that the RP can provide the appropriate services based on my residency status.

**Why this priority**: Compliance with user data reporting standards.

**Independent Test**: Can be tested by logging in as a "foreign" user and verifying the `account_type` claim in the resulting ID Token.

**Acceptance Scenarios**:

1. **Given** a user with `account_type` set to "foreign", **When** an ID Token is issued, **Then** the `sub_attributes.account_type` claim MUST be "foreign".
2. **Given** a user with `account_type` set to "standard", **When** an ID Token is issued, **Then** the `sub_attributes.account_type` claim MUST be "standard".

---

### User Story 4 - Native App Integration Support (Priority: P3)

As a mobile app developer, I want to pass Singpass-specific native launch parameters during authorization so that I can test seamless app-to-app transitions.

**Why this priority**: Enhances the mock server's utility for mobile development testing.

**Independent Test**: Can be tested by including `redirect_uri_https_type` and `app_launch_url` in a PAR request and verifying they are accepted.

**Acceptance Scenarios**:

1. **Given** a PAR request, **When** optional parameters `redirect_uri_https_type` and `app_launch_url` are provided, **Then** the server MUST accept the request without stripping these fields.

---

### Edge Cases

- **Expired PAR Request**: System handles attempts to use `request_uri` at exactly 61 seconds.
- **DPoP Nonce Replay**: System handles multiple attempts to use the same `DPoP-Nonce` within a short window (nonce should be single-use or time-bound).
- **Missing Account Type**: System defaults to "standard" if the `account_type` is not specified in the database, but logs a warning for data integrity.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST enforce a 60-second Time-To-Live (TTL) for PAR `request_uri` tokens.
- **FR-002**: System MUST validate that `state` and `nonce` parameters in PAR requests are at least 30 characters long.
- **FR-003**: System MUST implement the `DPoP-Nonce` mechanism for both PAR and Token endpoints, returning the nonce in the response headers.
- **FR-004**: System MUST validate the `nonce` claim in DPoP proofs against the expected server-provided nonce.
- **FR-005**: System MUST return a `401 Unauthorized` with `WWW-Authenticate: DPoP error="use_dpop_nonce"` when a required DPoP nonce is missing or invalid.
- **FR-006**: ID Token generation MUST map the user's `account_type` attribute (Singapore standard vs Foreign) to the `sub_attributes.account_type` claim.
- **FR-007**: PAR request schema MUST support optional Singpass parameters: `redirect_uri_https_type` (string) and `app_launch_url` (URL).

### Key Entities *(include if feature involves data)*

- **User**: Represents the identity being authenticated. Needs a new or updated attribute for `account_type`.
- **PAR Request**: Represents the pushed authorization state. Now includes optional fields for native app launch.
- **DPoP Nonce**: A transient entity used to ensure freshness of DPoP proofs.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of remediation items identified in the Compliance Audit Report are implemented and verified.
- **SC-002**: PAR `request_uri` expiration is strictly enforced at 60 seconds (verified via automated tests).
- **SC-003**: All DPoP-bound requests successfully enforce server-provided nonces, reducing replay vulnerability window to zero.
- **SC-004**: ID Tokens correctly distinguish between standard and foreign users as verified by integration tests.
