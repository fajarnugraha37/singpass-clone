# Feature Specification: Scope Propagation Fix

**Feature Branch**: `025-fix-scope-propagation`  
**Created**: 2026-03-16  
**Status**: Draft  
**Input**: User description: "Scope Propagation Fix (Critical Pipeline) **Finding**: #14 (🔴 Critical) **branch**: 025-fix-scope-propagation ### Problem Scopes from the PAR request are not propagated through the authorization code to the token exchange, causing UserInfo to always return empty `person_info`. ### Root Cause Trace ``` PAR (scope stored) → AuthCode (scope MISSING) → Token (hardcoded 'openid') → AccessToken (stored as 'openid') → UserInfo (filters by 'openid' = empty) ``` ### Acceptance Criteria 1. `AuthorizationCode` interface MUST include a `scope: string` field. 2. `authorization_codes` DB table MUST have a `scope` column. 3. `GenerateAuthCode` MUST read `parRequest.payload.scope` and store it in the auth code. 4. `TokenExchangeUseCase` MUST use `authCode.scope` for both ID Token generation and access token storage (NOT hardcoded `'openid'`). 5. Given a PAR with `scope="openid uinfin name email"`, the resulting access token MUST store `scope="openid uinfin name email"`. "

## Clarifications

### Session 2026-03-16
- Q: How should multiple scopes be formatted and stored within the `scope` string field? → A: Space-delimited string (e.g., "openid uinfin name")
- Q: Should the fix automatically inject "openid" if missing or strictly propagate PAR? → A: Strict propagation (store only what PAR provides)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Full Scope Propagation for Singpass Data (Priority: P1)

A Singpass client requests specific user data scopes (e.g., uinfin, name, email) during the Pushed Authorization Request (PAR). The authorization flow should ensure these scopes are carried through to the access token so the UserInfo endpoint can return the requested data.

**Why this priority**: This is critical for the Singpass integration. Without scope propagation, the UserInfo endpoint cannot return any specific user information, breaking the core value proposition of the service.

**Independent Test**: Complete an end-to-end OAuth flow starting from a PAR with `scope="openid uinfin name email"`. Verify the access token stores these scopes and the UserInfo endpoint returns the corresponding data.

**Acceptance Scenarios**:

1. **Given** a PAR request with `scope="openid uinfin name email"`, **When** the authorization code is exchanged for a token, **Then** the resulting access token should contain the exact scope string "openid uinfin name email".
2. **Given** an access token with the `uinfin` scope, **When** the UserInfo endpoint is called with this token, **Then** the `person_info` claim should contain the user's NRIC/FIN.

---

### User Story 2 - ID Token Scope Consistency (Priority: P2)

The ID Token generated during the token exchange should also reflect the authorized scopes to ensure the client is aware of what user information was granted.

**Why this priority**: Consistency between the access token and ID token is expected in OIDC and helps clients manage their local user state.

**Independent Test**: Perform token exchange and inspect the ID Token claims to ensure they match the authorized scopes.

**Acceptance Scenarios**:

1. **Given** an authorization code with scope "openid uinfin", **When** the token exchange occurs, **Then** the generated ID Token should contain claims corresponding to the "uinfin" scope.

---

### Edge Cases

- **What happens when the PAR scope is empty?**
  - The system MUST perform strict propagation and store an empty string or the exact provided scope; no automatic injection of "openid" should occur during this propagation fix.
- **How does the system handle scopes not recognized by the provider?**
  - The system should store and propagate all requested scopes as per the PAR request, assuming validation happened at the PAR endpoint.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The `AuthorizationCode` interface and entity MUST include a `scope: string` field, containing a space-delimited list of scopes.
- **FR-002**: The `authorization_codes` database table MUST have a `scope` column (TEXT/VARCHAR) to store space-delimited scope strings.
- **FR-003**: The `GenerateAuthCode` use case MUST read the `scope` from the associated `PARRequest` payload and store it in the generated authorization code.
- **FR-004**: The `TokenExchangeUseCase` MUST retrieve the `scope` from the authorization code instead of using a hardcoded `'openid'` string.
- **FR-005**: The `TokenExchangeUseCase` MUST use the retrieved `scope` for both ID Token generation and Access Token storage.
- **FR-006**: The system MUST ensure that the resulting Access Token's scope exactly matches the scope requested and authorized in the initial PAR request.

### Key Entities *(include if feature involves data)*

- **AuthorizationCode**: The transient object representing an authorized user session awaiting token exchange; now extended to persist the `scope` granted.
- **AccessToken**: The final token issued; must accurately reflect the authorized scopes to permit data access at the UserInfo endpoint.
- **PARRequest**: The initial request containing the client's desired scopes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of the scope string provided in the PAR request is successfully persisted in the `authorization_codes` table.
- **SC-002**: 100% of the scope string from the authorization code is transferred to the issued Access Token.
- **SC-003**: The UserInfo endpoint returns non-empty `person_info` for at least 95% of requests where Singpass data scopes (e.g., uinfin) were requested and authorized.
- **SC-004**: Zero hardcoded `'openid'` strings remain in the token generation logic for scopes.
