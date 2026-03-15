# Feature Specification: Extend UserInfo Scope Handling & person_info Fields

**Feature Branch**: `026-userinfo-scope-handling`  
**Created**: 2026-03-16  
**Status**: Draft  
**Input**: User description: "Extend UserInfo Scope Handling & person_info Fields Finding: #15 (🔴 Critical — depends on SPEC-F13) Branch: 026-userinfo-scope-handling Depends On: SPEC-F13 (scope propagation must be fixed first) ### Problem Even after scope propagation is fixed, the PersonInfo interface and UserData are incomplete. The mobileno scope is not handled. The user.identity scope is not handled for the ID Token sub_attributes. ### Scope → UserInfo person_info Claims Matrix | Scope | person_info Field | Value Format | DB Source | |-------|---------------------|--------------|-----------| | uinfin | person_info.uinfin | { value: \"S1234567A\" } | users.nric | | name | person_info.name | { value: \"JOHN DOE\" } | users.name | | email | person_info.email | { value: \"john@example.com\" } | users.email | | mobileno | person_info.mobileno | { value: \"91234567\" } | users.mobileno (new) | ### Scope → ID Token sub_attributes Claims Matrix | Scope | sub_attributes Field | DB Source | |-------|----------------------|-----------| | user.identity | identity_number | users.nric | | user.identity | identity_coi | Hardcode \"SG\" | | user.identity | account_type | Hardcode \"standard\" | | name | name | users.name | | email | email | users.email | | mobileno | mobileno | users.mobileno | ### Acceptance Criteria 1. PersonInfo interface MUST include mobileno?: PersonInfoField. 2. UserData interface MUST include mobileno: string. 3. users DB table MUST have a mobileno column. 4. mapUserInfoClaims() MUST handle the mobileno scope. 5. Given scope=\"openid uinfin name email mobileno\", UserInfo MUST return all 4 fields in person_info. 6. Given scope=\"openid\" only, UserInfo MUST return empty person_info: {}. 7. ID Token MUST include sub_attributes based on scopes per the matrix above (depends on SPEC-F05). ### Expected UserInfo Response (scope: openid uinfin name email) { \"sub\": \"7c9c72ec-5be2-495a-a78e-61e809a2a236\", \"iss\": \"https://vibe-auth.example.com\", \"aud\": \"test-client\", \"iat\": 1710400000, \"person_info\": { \"uinfin\": { \"value\": \"S1234567A\" }, \"name\": { \"value\": \"JOHN DOE\" }, \"email\": { \"value\": \"john@example.com\" } } }"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Requesting Full User Profile (Priority: P1)

As a relying party application, I want to receive the user's mobile number and identity information so that I can provide a personalized and verified experience.

**Why this priority**: Core value of the feature extension. Relying parties need the mobile number and identity attributes for compliance and communication.

**Independent Test**: Can be tested by initiating an OIDC flow with `openid uinfin name email mobileno user.identity` scopes and verifying the UserInfo response and ID Token claims.

**Acceptance Scenarios**:

1. **Given** a user with a valid mobile number in the system, **When** a client requests the `mobileno` scope and calls the UserInfo endpoint, **Then** the response must include `person_info.mobileno` with the correct value.
2. **Given** an authorized session with the `user.identity` scope, **When** an ID Token is issued, **Then** it must contain the `sub_attributes` object with `identity_number`, `identity_coi`, and `account_type`.

---

### User Story 2 - Minimal Privacy Disclosure (Priority: P2)

As a privacy-conscious user, I want to ensure that only the scopes I have authorized are shared with the client application.

**Why this priority**: Ensures the system adheres to OIDC privacy standards and correctly filters data based on granted scopes.

**Independent Test**: Can be tested by requesting only the `openid` scope and verifying that `person_info` is empty.

**Acceptance Scenarios**:

1. **Given** an authorized session with only the `openid` scope, **When** the UserInfo endpoint is called, **Then** the `person_info` object must be present but empty `{}`.
2. **Given** an authorized session with `openid name`, **When** the UserInfo endpoint is called, **Then** `person_info` must only contain the `name` field.

## Clarifications

### Session 2026-03-16

- Q: Should the system omit missing attributes or return null/empty? → A: Omit the field entirely
- Q: If user.identity is authorized but NRIC is missing, how to handle sub_attributes? → A: Omit identity_number only, return others
- Q: What is the target maximum latency for the UserInfo response? → A: 200ms

## User Scenarios & Testing *(mandatory)*

### Edge Cases

- **Missing User Data**: If a user is missing a specific attribute (e.g., mobile number) in the verified identity store but the corresponding scope is granted, the system MUST omit the field entirely from both `person_info` and `sub_attributes`.
- **Scope Propagation Failure**: If scope propagation (SPEC-F13) fails, the UserInfo response might not reflect the requested scopes; this feature depends on that underlying fix.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST support the `mobileno` scope for both UserInfo and ID Token claims.
- **FR-002**: The UserInfo response MUST include the `person_info` object, populated with fields corresponding to the authorized scopes (`uinfin`, `name`, `email`, `mobileno`).
- **FR-003**: Each field in `person_info` MUST follow the `{ value: "..." }` format as per Myinfo standards.
- **FR-004**: The ID Token MUST include `sub_attributes` when the `user.identity`, `name`, `email`, or `mobileno` scopes are authorized.
- **FR-005**: The `sub_attributes` object MUST include `identity_number` (NRIC/FIN), `identity_coi` ("SG"), and `account_type` ("standard") when `user.identity` is authorized. If `identity_number` is unavailable, `identity_coi` and `account_type` MUST still be returned.
- **FR-006**: Additional attributes (`name`, `email`, `mobileno`) MUST be included in `sub_attributes` of the ID Token if their respective scopes are authorized.
- **FR-007**: The system MUST correctly map verified user attributes to the standardized OIDC claim formats defined in the Singpass FAPI 2.0 specifications.
- **FR-008**: If a requested attribute is unavailable for the authenticated user, the system MUST omit it from the response rather than returning null or empty values.
- **FR-009**: The ID Token MUST include `sub_type: "user"` to align with Singpass specifications.
- **FR-010**: The ID Token MUST include `amr` (Authentication Method Reference) and `acr` (Authentication Context Class Reference) claims.

### Key Entities

- **User Information**: The aggregate of identity data associated with a subject, including NRIC, name, email, and mobile number.
- **Claims Matrix**: The mapping logic that determines which data fields are exposed based on authorized OIDC scopes.
- **UserInfo Response**: The standardized JSON structure returned by the `/userinfo` endpoint, nested within `person_info`.
- **ID Token**: The signed and encrypted identity token containing `sub_attributes` and Singpass-specific claims.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of UserInfo requests with the `mobileno` scope correctly return the user's mobile number in the `person_info` block.
- **SC-002**: ID Tokens issued with the `user.identity` scope contain all three required identity fields in `sub_attributes` (or appropriate subset if NRIC is missing).
- **SC-003**: Data exposure is strictly limited to the authorized scopes; no unauthorized fields are leaked in `person_info` or `sub_attributes`.
- **SC-004**: The UserInfo response format matches the expected Singpass FAPI 2.0 structure.
- **SC-005**: UserInfo response latency MUST be under 200ms under normal operating conditions.

## Assumptions

- SPEC-F13 is successfully implemented, providing correct scope information to the UserInfo mapping logic.
- The system has the capability to securely manage and retrieve the mobile number for each user.
- The ID Token and UserInfo response are signed and encrypted as per FAPI 2.0 / Singpass requirements (handled by existing infra, but this feature must provide the correct payload).
