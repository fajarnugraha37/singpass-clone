# Feature Specification: ID Token Missing Claims

**Feature Branch**: `015-id-token-claims`  
**Created**: 2026-03-15  
**Status**: Draft  
**Input**: User description: "ID Token Missing Claims (acr, amr, sub_type, sub_attributes)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Mandatory Security Claims (Priority: P1)

As a Relying Party (RP) application, I need the ID Token to contain standard security claims (`acr`, `amr`, `sub_type`) so that I can verify the level of assurance and authentication methods used to secure the session.

**Why this priority**: These are mandatory claims for FAPI 2.0 and Singpass compliance. Without them, the ID Token is technically invalid according to the integration specification.

**Independent Test**: Can be tested by performing a basic login with only the `openid` scope and inspecting the decoded ID Token for the presence and correct format of `acr`, `amr`, and `sub_type`.

**Acceptance Scenarios**:

1. **Given** a user has successfully authenticated via password and SMS OTP, **When** the ID Token is issued, **Then** it MUST contain `"acr": "urn:singpass:authentication:loa:2"` and `"amr": ["pwd", "otp-sms"]`.
2. **Given** any successful authentication, **When** the ID Token is issued, **Then** it MUST contain `"sub_type": "user"`.
3. **Given** only the `openid` scope was requested, **When** the ID Token is issued, **Then** the `sub_attributes` claim SHOULD NOT be present.

---

### User Story 2 - Identity Attributes (Priority: P2)

As a Relying Party application, I need to receive the user's NRIC and account metadata when I request the `user.identity` scope so that I can uniquely identify the user in my system.

**Why this priority**: Core identity verification is a primary use case for the authentication service.

**Independent Test**: Can be tested by requesting the `user.identity` scope during authorization and verifying that the ID Token contains the `sub_attributes` object with `identity_number`, `identity_coi`, and `account_type`.

**Acceptance Scenarios**:

1. **Given** the `user.identity` scope is authorized, **When** the ID Token is issued, **Then** it MUST contain a `sub_attributes` object with `identity_number` matching the user's NRIC.
2. **Given** the `user.identity` scope is authorized, **When** the ID Token is issued, **Then** `sub_attributes` MUST include `"identity_coi": "SG"` and `"account_type": "standard"`.

---

### User Story 3 - Personal Profile Attributes (Priority: P3)

As a Relying Party application, I need to receive the user's name, email, and mobile number when I request the corresponding scopes (`name`, `email`, `mobileno`) to personalize the user experience.

**Why this priority**: Enhances the user profile but is not strictly required for the core authentication handshake.

**Independent Test**: Can be tested by requesting `name` and `email` scopes and verifying the presence of these fields within the `sub_attributes` object in the ID Token.

**Acceptance Scenarios**:

1. **Given** the `name` and `email` scopes are authorized, **When** the ID Token is issued, **Then** `sub_attributes` MUST contain the user's `name` and `email`.
2. **Given** the `mobileno` scope is authorized, **When** the ID Token is issued, **Then** `sub_attributes` MUST contain the user's mobile number.
3. **Given** multiple profile scopes are authorized (e.g., `user.identity` and `name`), **When** the ID Token is issued, **Then** `sub_attributes` MUST contain the union of all fields required by those scopes.

---

### Edge Cases

- **Missing User Data**: What happens if a scope is requested (e.g., `email`) but the user record has a null value for that field? (System should omit the specific field from `sub_attributes` rather than sending null/empty strings).
- **No Identity Scopes**: How does the system handle a request with scopes that don't map to any `sub_attributes`? (The `sub_attributes` claim should be omitted entirely).
- **Invalid LOA**: What happens if the authentication flow doesn't match a predefined LOA? (System should fail the token issuance or fallback to the lowest verified LOA).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST include the `acr` (Authentication Context Class Reference) claim in every ID Token, representing the Level of Assurance (LOA).
- **FR-002**: System MUST include the `amr` (Authentication Methods References) claim in every ID Token as an array of strings identifying the methods used (e.g., `pwd`, `otp-sms`, `face`).
- **FR-003**: System MUST include the `sub_type` claim with the fixed value `"user"` in every ID Token.
- **FR-004**: System MUST conditionally include a `sub_attributes` object in the ID Token if any of the following scopes are requested: `user.identity`, `name`, `email`, `mobileno`.
- **FR-005**: System MUST map the `user.identity` scope to `identity_number`, `identity_coi`, and `account_type` fields within `sub_attributes`.
- **FR-006**: System MUST map the `name`, `email`, and `mobileno` scopes to their respective fields within `sub_attributes`.
- **FR-007**: System MUST NOT include the `sub_attributes` claim if no identity-related scopes are authorized.
- **FR-008**: System MUST derive `identity_number` from the user's verified NRIC/FIN.

### Key Entities *(include if feature involves data)*

- **User**: Represents the authenticated person, containing attributes like NRIC, Name, Email, and Mobile Number.
- **ID Token**: The signed security token containing claims about the authentication event and the user.
- **Authorization Context**: Maintains the state of the current request, including the requested and authorized scopes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of issued ID Tokens contain valid `acr`, `amr`, and `sub_type` claims as per Singpass Integration Guide.
- **SC-002**: `sub_attributes` object is correctly populated with all requested identity fields for 100% of authorized requests.
- **SC-003**: ID Token size remains optimized by omitting the `sub_attributes` claim when no profile data is requested.
- **SC-004**: Successful parsing and validation of the ID Token by a standard OIDC/Singpass client library.

## Assumptions

- The mapping for `identity_coi` is hardcoded to "SG" (Singapore) as the primary country of issuance for the MVP.
- The mapping for `account_type` is hardcoded to "standard" for the MVP.
- `acr` values are derived from the authentication flow logic: Pwd only = LOA 1, Pwd + OTP = LOA 2, Pwd + Face = LOA 3.
- `mobileno` implementation depends on user data availability (partially addressed by SPEC-F14).
