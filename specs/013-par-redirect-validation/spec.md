# Feature Specification: PAR `redirect_uri` Registration Validation

**Feature Branch**: `013-par-redirect-validation`  
**Created**: 2026-03-15  
**Status**: Draft  
**Input**: User description: "PAR `redirect_uri` Registration Validation Finding: #3 (High) Problem redirect_uri is validated as a URL format by Zod but never checked against the client's pre-registered redirect URIs during PAR. Acceptance Criteria 1. During PAR registration, `redirect_uri` MUST be validated against the client's `redirectUris` list from the ClientRegistry. 2. If `redirect_uri` does not match any registered URI, the server MUST return `invalid_request` error. 3. Matching MUST be exact string comparison (no wildcards)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Secure PAR Registration (Priority: P1)

As an OAuth 2.0 Client, I want my `redirect_uri` to be validated against my registered URIs during the Pushed Authorization Request (PAR) registration, so that I am protected from open redirector attacks and my authorization requests are securely bound to my registered identity.

**Why this priority**: High security risk. Without this validation, an attacker could use a valid client's identity to push an authorization request that redirects the user to an untrusted URI, leading to credential or code leakage.

**Independent Test**: Can be fully tested by sending PAR requests with both valid and invalid `redirect_uri` values and verifying the server's response code and error message.

**Acceptance Scenarios**:

1. **Given** a client is registered with `redirectUris: ["https://app.vibe-auth.com/callback"]`, **When** a PAR is sent with `redirect_uri=https://app.vibe-auth.com/callback`, **Then** the server MUST accept the request and return a `request_uri`.
2. **Given** a client is registered with `redirectUris: ["https://app.vibe-auth.com/callback"]`, **When** a PAR is sent with `redirect_uri=https://malicious-site.com/steal-code`, **Then** the server MUST reject the request with an `invalid_request` error.
3. **Given** a client is registered with `redirectUris: ["https://app.vibe-auth.com/callback"]`, **When** a PAR is sent with `redirect_uri=https://app.vibe-auth.com/CALLBACK` (different case), **Then** the server MUST reject the request because matching is exact string comparison.
4. **Given** a client has NO registered `redirectUris` (empty list), **When** a PAR is sent with ANY `redirect_uri`, **Then** the server MUST reject the request.

---

### Edge Cases

- **Missing `redirect_uri`**: If the `redirect_uri` is omitted in the PAR, the system should follow OAuth 2.0 rules (if multiple URIs are registered, it might be required; if one is registered, it might be optional). [NEEDS CLARIFICATION: Should `redirect_uri` be mandatory in PAR regardless of registration count?]
- **Multiple Registered URIs**: If a client has multiple registered URIs, the provided one must match exactly one of them.
- **Encoded URIs**: The comparison should be done on the decoded URI value if received as part of a form-encoded payload, but since Hono/Zod usually handles this, we assume the input to the use case is the actual URI string.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST extract the `redirect_uri` from the Pushed Authorization Request (PAR) payload.
- **FR-002**: The system MUST retrieve the pre-registered `redirectUris` for the client from the `ClientRegistry`.
- **FR-003**: The system MUST perform an exact string comparison (case-sensitive) between the provided `redirect_uri` and each entry in the client's registered `redirectUris` list.
- **FR-004**: If the provided `redirect_uri` is present but does not match any registered URI, the system MUST throw an error that results in an `invalid_request` response (OAuth 2.0 standard).
- **FR-005**: If the client's `redirectUris` list is empty or undefined, any provided `redirect_uri` MUST be considered invalid.

### Key Entities *(include if feature involves data)*

- **ClientConfig**: The entity containing the registered configuration for a client, specifically the `redirectUris` property.
- **PushedAuthorizationRequest**: The transient entity representing the state of the authorization request being registered.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of PAR registration attempts with unregistered `redirect_uri` values are blocked.
- **SC-002**: Zero successful authorization flows can be initiated using a `request_uri` that was created with an invalid `redirect_uri`.
- **SC-003**: No regressions in existing PAR functionality (e.g., authentication context validation still works).
