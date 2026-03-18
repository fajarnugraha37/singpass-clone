# Feature Specification: Singpass Developer Portal (SDP) Compliance Fixes

**Feature Branch**: `036-sdp-compliance-fixes`  
**Created**: 2026-03-18  
**Status**: Draft  
**Input**: Compliance audit findings from # FINDINGS_DEVELOPER_PORTAL.md

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Secure and Transparent Login (Priority: P1)

As a digital service user, I want to clearly see which application I am logging into on the Singpass consent/login page, so that I can provide informed consent for my data.

**Why this priority**: High impact on security and user trust. Mandatory requirement for Singpass compliance (SDP App Name requirement).

**Independent Test**: Can be fully tested by initiating an OIDC flow with a specific client (e.g., `client_id=health-portal`) and verifying that the login page prominently displays "Log in to Digital Health Portal" (the registered name for that client).

**Acceptance Scenarios**:

1. **Given** a registered client with name "Digital Health Portal", **When** a user initiates an authentication session for this client, **Then** the login page MUST display "Log in to Digital Health Portal".
2. **Given** an authentication session, **When** the login page is loaded, **Then** the page MUST NOT show generic "Log in" text without the application context.

---

### User Story 2 - Standards-Based Client Authentication (Priority: P1)

As a client application developer, I want to use my JWKS URI for token-based authentication so that I can implement key rotation without manually updating my static JWKS object in the OIDC server.

**Why this priority**: Critical for security (enabling key rotation) and interoperability with modern OIDC clients using JWKS endpoints.

**Independent Test**: Configure a client with a `jwks_uri` instead of a static `jwks` object. Perform a PAR request using a `client_assertion` signed by a private key whose corresponding public key is only available at the `jwks_uri`. The server should fetch the key and authorize the request.

**Acceptance Scenarios**:

1. **Given** a client configured with a valid `jwks_uri`, **When** the client sends a PAR request with a valid `client_assertion`, **Then** the server MUST fetch the public keys from the URI and successfully validate the assertion.
2. **Given** a client with both `jwks` and `jwks_uri`, **When** authentication occurs, **Then** the server MUST prioritize the `jwks_uri` or fallback to ensure the latest key is used.

---

### User Story 3 - Authorized Scope Access (Priority: P1)

As a system administrator, I want to restrict the scopes a client can request to a pre-approved list, so that clients cannot access unauthorized user data they haven't been cleared for.

**Why this priority**: Essential for data privacy and compliance with Singpass authorization models (Allowed Scopes requirement).

**Independent Test**: Configure a client with `allowedScopes` set to `["openid", "profile"]`. Attempt a PAR request with `scope="openid profile myinfo.nric_number"`. The request should be rejected.

**Acceptance Scenarios**:

1. **Given** a client with specific `allowedScopes`, **When** the client requests a scope outside this list, **Then** the server MUST reject the request with an `invalid_scope` error.
2. **Given** a client with `allowedScopes`, **When** the client requests a subset of these scopes, **Then** the server MUST accept the request.

---

### User Story 4 - Validated Redirect URIs (Priority: P2)

As a security auditor, I want to ensure that redirect URIs and site URLs do not use IP addresses, so that identity verification is based on verifiable DNS hostnames.

**Why this priority**: Mandatory security requirement from Singpass to prevent impersonation and ensure host-based security.

**Independent Test**: Attempt to register or configure a client with a `redirect_uri` like `https://123.123.1.1/callback`. The system should block this configuration.

**Acceptance Scenarios**:

1. **Given** a client configuration, **When** a `redirect_uri` or `site_url` contains an IPv4 or IPv6 address, **Then** the system MUST reject the configuration.
2. **Given** an existing client, **When** it attempts an auth flow with an IP-based `redirect_uri`, **Then** the server MUST reject the request.

---

### User Story 5 - Administrative Transparency (Priority: P3)

As a Singpass administrator, I want to see complete administrative details for each client (description, site URL, support emails, environment) so that I can manage the ecosystem effectively.

**Why this priority**: Compliance with SDP data schema requirements for administrative and notification purposes.

**Independent Test**: Fetch the client configuration via the management API (or view in registry) and verify all administrative fields are present and populated.

**Acceptance Scenarios**:

1. **Given** a client registration request, **When** `appDescription`, `siteUrl`, or `supportEmails` are missing, **Then** the registration SHOULD be flagged or rejected (depending on environment strictness).
2. **Given** a client, **When** viewing its details, **Then** the `environment` (Staging/Production) MUST be clearly visible.

---

### Edge Cases

- **JWKS Fetch Failure**: The system MUST return a `401 Unauthorized` (or appropriate error) if a client's `jwks_uri` is unreachable or returns invalid content, with internal logging of the failure.
- **Scope Overlap**: If a client requests multiple scopes where some are authorized and some are not, the entire request MUST be rejected (strict validation).
- **Test Account Overflow**: If a client is in 'Staging' environment and reaches the 100 test account limit, the system MUST prevent the creation or linking of new user accounts for that client.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The login page MUST display the Client Name associated with the current `client_id` in the authentication session.
- **FR-002**: The server MUST support fetching and caching client public keys from a `jwks_uri` endpoint during client authentication (PAR and Token endpoints).
- **FR-003**: The server MUST validate that the requested `scope` in a PAR request is a subset of the client's `allowedScopes`.
- **FR-004**: The system MUST prevent the use of IP addresses in `redirect_uri` and `site_url` fields for all environments.
- **FR-005**: The `ClientConfig` MUST include administrative fields: `appDescription`, `siteUrl`, and `supportEmails`.
- **FR-006**: The `ClientConfig` MUST include an `environment` field ('Staging' | 'Production').
- **FR-007**: The system MUST enforce a limit of 100 test accounts per client when the client is in the 'Staging' environment.
- **FR-008**: The system MUST cache keys fetched from `jwks_uri` for 1 hour by default, or respect the `Cache-Control: max-age` header from the response if it specifies a longer or shorter duration (with a minimum of 60 seconds).

### Key Entities *(include if feature involves data)*

- **ClientConfig**: Extended to include `clientName`, `jwksUri`, `allowedScopes`, `appDescription`, `siteUrl`, `supportEmails`, and `environment`.
- **UserAccount**: Linked to `ClientConfig` (for test accounts) to enable counting and enforcement of environment-specific limits.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of audit findings from `FINDINGS_DEVELOPER_PORTAL.md` are addressed in the implementation.
- **SC-002**: Automated tests confirm that clients cannot request scopes outside their `allowedScopes` (100% pass rate).
- **SC-003**: Validation logic successfully blocks registration of `redirect_uri` containing IP patterns (regex validation).
- **SC-004**: System successfully authenticates a client using a `jwks_uri` for key lookup with < 500ms overhead for the first fetch.
- **SC-005**: The `login.astro` page correctly renders the `clientName` for all active auth sessions.
