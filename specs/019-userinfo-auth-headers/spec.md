# Feature Specification: UserInfo `WWW-Authenticate` Headers

**Feature Branch**: `019-userinfo-auth-headers`  
**Created**: 2026-03-15  
**Status**: Completed  
**Input**: User description: "UserInfo `WWW-Authenticate` Headers **Finding**: #8 (🟡 Medium) **Branch Suggestion**: `fix/userinfo-www-authenticate` ### Problem UserInfo endpoint only sets `WWW-Authenticate` header for missing Authorization header, but not for `invalid_token` or `invalid_dpop_proof` errors as required by Singpass spec. ### Doc Reference `docs/singpass/technical-specifications/integration-guide/5.-requesting-for-userinfo.md`: "These parameters will also be returned in the `WWW-Authenticate` header." ### Expected Header Format ``` WWW-Authenticate: DPoP error="invalid_token", error_description="The access token is expired" WWW-Authenticate: DPoP error="invalid_dpop_proof", error_description="DPoP proof signature invalid" ``` ### Acceptance Criteria 1. All 401 responses from `/userinfo` MUST include a `WWW-Authenticate` header. 2. The header MUST use the format `DPoP error="<code>", error_description="<desc>"`. 3. Applicable error codes: `invalid_request`, `invalid_token`, `invalid_dpop_proof`."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Request with Expired Token (Priority: P1)

As a Relying Party (RP), when I request UserInfo with an expired access token, I want to receive a `WWW-Authenticate` header detailing the error so that I can automatically handle token refreshment.

**Why this priority**: Critical for automated error handling and compliance with the Singpass specification.

**Independent Test**: Can be fully tested by sending a request to `/userinfo` with an expired token and verifying the 401 status and the `WWW-Authenticate` header content.

**Acceptance Scenarios**:

1. **Given** a UserInfo endpoint, **When** a request is made with an expired access token, **Then** the response MUST be 401 Unauthorized and include `WWW-Authenticate: DPoP error="invalid_token", error_description="The access token is expired"`.

---

### User Story 2 - Request with Invalid DPoP Proof (Priority: P1)

As an RP, when I request UserInfo with an invalid DPoP proof, I want to receive a `WWW-Authenticate` header detailing the error so that I can debug the proof generation.

**Why this priority**: Essential for security debugging and DPoP protocol compliance.

**Independent Test**: Can be tested by sending a request with an incorrectly signed DPoP proof and verifying the 401 status and header.

**Acceptance Scenarios**:

1. **Given** a UserInfo endpoint, **When** a request is made with an invalid DPoP proof signature, **Then** the response MUST be 401 Unauthorized and include `WWW-Authenticate: DPoP error="invalid_dpop_proof", error_description="DPoP proof signature invalid"`.

---

### User Story 3 - Request without Authorization (Priority: P2)

As an RP, when I forget to include the Authorization header, I want to receive a `WWW-Authenticate` header indicating the required authentication scheme.

**Why this priority**: standard OAuth2/DPoP behavior for unauthorized requests.

**Independent Test**: Can be tested by sending a request without the `Authorization` header and verifying the 401 status and header.

**Acceptance Scenarios**:

1. **Given** a UserInfo endpoint, **When** a request is made without an `Authorization` header, **Then** the response MUST be 401 Unauthorized and include `WWW-Authenticate: DPoP error="invalid_request", error_description="Missing Authorization header"`.

### Edge Cases

- **Invalid Request Format**: How does the system handle a malformed Authorization header? (Should return `invalid_request`)
- **Multiple Error Conditions**: If both token is expired and DPoP proof is invalid, which error is prioritized in the header? (Usually the first one encountered or the most critical).

## Assumptions

- **Existing Infrastructure**: The UserInfo endpoint is already implemented and protected by DPoP authentication.
- **Error Mapping**: Existing error handling logic can be extended to include these headers without significant refactoring.
- **Standard Compliance**: The implementation follows RFC 6750 (for WWW-Authenticate) as adapted by RFC 9449 (DPoP).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST include a `WWW-Authenticate` header in all 401 responses from the UserInfo endpoint.
- **FR-002**: The `WWW-Authenticate` header MUST use the `DPoP` authentication scheme.
- **FR-003**: For expired or invalid tokens, the header MUST include `error="invalid_token"`.
- **FR-004**: For invalid DPoP proofs, the header MUST include `error="invalid_dpop_proof"`.
- **FR-005**: For missing or malformed requests, the header MUST include `error="invalid_request"`.
- **FR-006**: The header MUST include an `error_description` field providing a human-readable explanation of the error.

### Key Entities *(include if feature involves data)*

- **UserInfo Response**: The HTTP response object returned by the `/userinfo` endpoint, containing headers and potentially an error body.
- **DPoP Authentication Scheme**: The security scheme defining how `WWW-Authenticate` challenges are structured for DPoP-protected resources.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of 401 responses from the UserInfo endpoint include a valid `WWW-Authenticate` header following the specified format.
- **SC-002**: Automated test suite confirms that `invalid_token`, `invalid_dpop_proof`, and `invalid_request` errors correctly trigger the corresponding header values.
- **SC-003**: Response headers are compliant with both Singpass Integration Guide and RFC 9449 (DPoP) standards.
