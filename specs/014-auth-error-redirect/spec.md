# Feature Specification: Auth Error Redirect Compliance

**Feature Branch**: `014-auth-error-redirect`  
**Created**: 2026-03-15  
**Status**: Draft  
**Input**: User description: "Auth Error Redirect Compliance **Finding**: #4 (🟢 Low) **Branch Suggestion**: `fix/auth-error-redirect` ### Problem Auth errors during login/2FA return JSON responses instead of redirecting to the client's `redirect_uri` with error parameters per OIDC spec (Section 3.1.2.6). ### Acceptance Criteria 1. When user authentication permanently fails (max retries exceeded), the server SHOULD redirect to `redirect_uri?error=login_required&state={state}`. 2. Temporary failures (wrong password, wrong OTP) MAY continue to return JSON responses since the frontend handles them. 3. The `state` parameter from the original PAR request MUST be included in error redirects."

## User Scenarios & Testing *(mandatory)*

## Clarifications

### Session 2026-03-15
- Q: What should be the default maximum number of retries for password and OTP entry before a terminal failure is triggered? → A: 3 Retries (Standard)
- Q: Should we always use error=login_required, or differentiate between specific failure reasons? → A: login_required (Session expired/invalid)
- Q: How should the terminal error be handled? → A: Backend returns 302 Found (Direct redirect)
- Q: Should terminal authentication failures be logged as a security event? → A: Log to Security Audit (Session, User, IP, Reason)
- Q: Should we implement specific rate limiting for authentication attempts? → A: IP-based request throttling

### User Story 1 - Permanent Auth Failure Redirect (Priority: P1)

As a client application, I want the auth server to redirect the user back to my `redirect_uri` with an error code if their authentication permanently fails, so that I can handle the failure gracefully according to the OIDC specification.

**Why this priority**: Core compliance requirement for OIDC/FAPI. Ensures the client app is notified of terminal authentication failures instead of the user being stuck on a generic error page or receiving an unhandled JSON response.

**Independent Test**: Can be tested by simulating a user reaching the maximum number of failed authentication attempts and verifying the browser is redirected to the client's `redirect_uri` with `error=login_required` and the correct `state`.

**Acceptance Scenarios**:

1. **Given** a user is in a login session initiated via PAR, **When** the user exceeds the maximum password retries, **Then** the server redirects the user to `redirect_uri?error=login_required&state={state}`.
2. **Given** a user is in a 2FA session, **When** the user exceeds the maximum OTP retries, **Then** the server redirects the user to `redirect_uri?error=login_required&state={state}`.

---

### User Story 2 - Temporary Auth Failure Feedback (Priority: P2)

As a user, I want to receive immediate feedback when I enter an incorrect password or OTP, so that I can try again without being redirected away from the login page.

**Why this priority**: Essential for a good user experience. Prevents unnecessary redirects for simple typos or temporary issues.

**Independent Test**: Can be tested by entering an incorrect password once and verifying that a JSON error response is returned (handled by the frontend to show an error message) and no redirect occurs.

**Acceptance Scenarios**:

1. **Given** a user is on the login page, **When** the user enters an incorrect password (not exceeding retries), **Then** the server returns a JSON error response.
2. **Given** a user is on the 2FA page, **When** the user enters an incorrect OTP (not exceeding retries), **Then** the server returns a JSON error response.

---

### Edge Cases

- **Invalid Session State**: What happens if the session is lost or corrupted before the terminal failure redirect? (Assumption: System displays a generic error page if `redirect_uri` cannot be retrieved).
- **Missing State Parameter**: How to handle redirects when the original PAR request did not include a `state`? (Requirement: Redirect without `state` parameter).
- **Session Timeout**: Does a session timeout count as a permanent failure? (Assumption: Session timeouts should also redirect with `error=login_required` if possible).
- **IP Throttling**: How does the system handle users on a shared IP (e.g., corporate VPN) if one user triggers rate limiting? (Assumption: Standard IP-based limits apply; legitimate users may be temporarily impacted until the block expires).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST track the number of failed authentication attempts (password and OTP) within a single session context.
- **FR-002**: Upon reaching the maximum allowed retries (3 failed attempts), the system MUST terminate the authentication attempt and initiate the error redirect.
- **FR-003**: For terminal failures, the backend MUST issue a direct `302 Found` redirect to the `redirect_uri` specified in the original authorization request.
- **FR-004**: The terminal failure redirect MUST include the query parameter `error=login_required`.
- **FR-005**: The terminal failure redirect MUST include the original `state` parameter if it was provided by the client.
- **FR-006**: Temporary failures (incorrect input within retry limits) MUST return a JSON response containing error details suitable for frontend display.
- **FR-007**: Every terminal authentication failure MUST be logged as a security audit event, capturing the session ID, user identity (if known), source IP, and failure reason (e.g., "max retries exceeded").
- **FR-008**: The system MUST implement IP-based rate limiting for authentication endpoints to protect against automated brute-force attacks. Throttled requests SHOULD receive a `429 Too Many Requests` response.

### Key Entities *(include if feature involves data)*

- **Auth Session**: Represents the ongoing login/2FA attempt, storing the retry count, `redirect_uri`, and `state`.
- **Authentication Attempt**: Individual events of password or OTP submission.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of terminal authentication failures result in a redirect to the client `redirect_uri` with OIDC-compliant error parameters.
- **SC-002**: The `state` parameter is correctly preserved and returned in all error redirects when originally provided.
- **SC-003**: The system correctly distinguishes between temporary failures (JSON response) and permanent failures (Redirect).
- **SC-004**: No sensitive session data is leaked in the error redirect URL.
