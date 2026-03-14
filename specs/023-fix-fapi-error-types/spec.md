# Feature Specification: Fix FAPI Error Types

**Feature Branch**: `023-fix-fapi-error-types`  
**Created**: 2026-03-15  
**Status**: Draft  
**Input**: User description: "Missing Error Types in FapiErrors **Finding**: #12 (Low) ### Problem `server_error`, `temporarily_unavailable`, and `invalid_token` are specified by Singpass but not defined in `FapiErrors` or `tokenErrorResponseSchema`. ### Acceptance Criteria 1. `tokenErrorResponseSchema` MUST include all error codes from the Singpass spec. 2. `FapiErrors` helper MUST have factory methods for all specified error codes."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - API Client Receives Specification-Compliant Errors (Priority: P1)

As an API client developer, when the authorization server encounters a token-related error, I want to receive an error response that strictly conforms to the Singpass specification, so that my client application can correctly handle all possible error conditions.

**Why this priority**: This is critical for interoperability and ensuring client applications can reliably handle errors from the authentication server.

**Independent Test**: This can be tested by triggering each of the missing error conditions (`server_error`, `temporarily_unavailable`, `invalid_token`) at the token endpoint and verifying that the JSON response body contains the correct `error` code as per the specification.

**Acceptance Scenarios**:

1. **Given** the token endpoint receives a request that causes an internal server error, **When** the server processes the request, **Then** it MUST respond with a JSON object containing `"error": "server_error"`.
2. **Given** the token endpoint is temporarily unavailable, **When** the server receives a request, **Then** it MUST respond with a JSON object containing `"error": "temporarily_unavailable"`.
3. **Given** the token endpoint receives a request with an invalid token (e.g., malformed, expired, or invalid signature), **When** the server validates the token, **Then** it MUST respond with a JSON object containing `"error": "invalid_token"`.

### Edge Cases

- What happens if an error occurs that is not one of the standard OIDC/FAPI errors or the newly added Singpass errors? The system should default to `server_error`.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The `tokenErrorResponseSchema` used for validating token endpoint error responses MUST be updated to include `server_error`, `temporarily_unavailable`, and `invalid_token` as valid enum values for the `error` field.
- **FR-002**: The `FapiErrors` helper/factory class MUST include static methods or factories for creating standardized error responses for `server_error`, `temporarily_unavailable`, and `invalid_token`.
- **FR-003**: The token endpoint logic MUST utilize the new `FapiErrors` helpers to return the correct error response when a corresponding error condition is met.

### Key Entities *(include if feature involves data)*

- **FapiErrorResponse**: A JSON object representing an error response from the token endpoint. Key attributes: `error` (string), `error_description` (string, optional).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of the token error codes specified in the Singpass documentation are implemented in the `tokenErrorResponseSchema` and `FapiErrors` helper.
- **SC-002**: When any of the newly added error conditions (`server_error`, `temporarily_unavailable`, `invalid_token`) are triggered during integration tests, the API response MUST validate successfully against the updated `tokenErrorResponseSchema`.
- **SC-003**: Code coverage for the `FapiErrors` helper functions related to the new error types is at least 80%.
