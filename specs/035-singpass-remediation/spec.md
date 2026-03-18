# Feature Specification: Singpass Compliance Remediation

**Feature Branch**: `035-singpass-remediation`  
**Created**: 2026-03-18  
**Status**: Draft  
**Input**: User description: "Please remediate following findings... (Audit Report: Singpass Developer Portal)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Scope Authorization Enforcement (Priority: P1)

As a security-conscious identity provider, I want to ensure that clients can only request scopes they have been explicitly authorized for, so that I prevent unauthorized data access (scope escalation).

**Why this priority**: High severity finding. Essential for basic security and compliance with Singpass "Allowed Scopes" policy.

**Independent Test**: Can be tested by attempting a PAR registration with a scope not in the client's `allowedScopes` list. The request should be rejected with an appropriate error (e.g., `invalid_scope`).

**Acceptance Scenarios**:

1. **Given** a registered client with `allowedScopes` set to `["openid", "uinfin"]`, **When** the client makes a PAR request with `scope="openid uinfin name"`, **Then** the request MUST be rejected.
2. **Given** a registered client with `allowedScopes` set to `["openid", "uinfin"]`, **When** the client makes a PAR request with `scope="openid uinfin"`, **Then** the request MUST be accepted.

---

### User Story 2 - Redirect URL Safety Enforcement (Priority: P1)

As a security-conscious identity provider, I want to prohibit the use of IP addresses in redirect and site URLs, and enforce HTTPS protocols (except for local development), so that I comply with Singpass security policies for production environments.

**Why this priority**: High severity finding. IP addresses in URLs are strictly prohibited by Singpass.

**Independent Test**: Can be tested by registering a client with an IP-based redirect URL or site URL. The system should reject the configuration or fail the authentication flow.

**Acceptance Scenarios**:

1. **Given** a PAR request with `redirect_uri="https://123.123.1.1/callback"`, **When** the system validates the URI, **Then** it MUST be rejected.
2. **Given** a PAR request with `redirect_uri="http://myapp.com/callback"`, **When** the system is not in a development environment, **Then** it MUST be rejected.
3. **Given** a PAR request with `redirect_uri="https://myapp.com/callback"`, **When** the system validates the URI, **Then** it MUST be accepted.

---

### User Story 3 - Client Activation Management (Priority: P2)

As an administrator, I want to be able to activate or deactivate clients, so that I can prevent deactivated applications from performing any authentication transactions.

**Why this priority**: Medium severity finding. Standard feature for lifecycle management and compliance.

**Independent Test**: Can be tested by setting a client's status to `Deactivated` and attempting any OIDC flow (PAR, Authorization, Token). All should be rejected.

**Acceptance Scenarios**:

1. **Given** a client with `isActive` set to `false`, **When** the client attempts a PAR registration, **Then** the request MUST be rejected.
2. **Given** a client with `isActive` set to `true`, **When** the client attempts a PAR registration, **Then** the request MUST be accepted.

---

### User Story 4 - Entity and Metadata Association (Priority: P2)

As a platform owner, I want to associate each client with a Business Entity (UEN) and store complete application metadata (site URL, description, support emails), so that I can provide administrative oversight and entity-level features.

**Why this priority**: Medium severity finding. Necessary for mirroring the Singpass Developer Portal's ownership model and metadata requirements.

**Independent Test**: Can be tested by verifying that the `ClientConfig` domain model and database schema include `uen`, `siteUrl`, `appDescription`, and `supportEmails` fields.

**Acceptance Scenarios**:

1. **Given** a new client registration, **When** the UEN is provided, **Then** it MUST be persisted and associated with the client.
2. **Given** a client configuration, **When** retrieved from the registry, **Then** all metadata fields (`appDescription`, `siteUrl`, `supportEmails`) MUST be present.

---

### Edge Cases

- **Mixed Scopes**: What happens when a request contains both authorized and unauthorized scopes? (Strategy: Reject the entire request if any scope is unauthorized).
- **Environment Context**: How does the system distinguish between development (allowing `localhost`) and production (prohibiting IPs and HTTP) for URL validation? (Strategy: Use an environment variable or configuration flag).
- **Token Exchange for Deactivated Client**: What happens if a client is deactivated *after* an authorization code is issued but *before* token exchange? (Strategy: The token endpoint MUST also check the client's activation status).

## Requirements *(mandatory)*

### Assumptions

- **Development Environment**: The system can reliably detect if it is running in a local development environment to allow `http://localhost` for Redirect URLs.
- **Audit Tooling**: The audit report provided is the complete and final list of compliance gaps for this phase.
- **Data Persistence**: A mechanism (like a database or managed registry) exists or will be implemented to store the extended client metadata.

### Functional Requirements

- **FR-001**: System MUST extend `ClientConfig` domain model to include: `allowedScopes: string[]`, `isActive: boolean`, `uen: string`, `siteUrl?: string`, `appDescription?: string`, `supportEmails?: string[]`, `hasAcceptedAgreement: boolean`.
- **FR-002**: System MUST validate that all requested scopes in a PAR request are present in the client's `allowedScopes` list.
- **FR-003**: System MUST reject any Redirect URL or Site URL that contains an IP address.
- **FR-004**: System MUST enforce `https://` protocol for all Redirect and Site URLs, except when the host is `localhost` or `127.0.0.1` (only in development environments).
- **FR-005**: System MUST prevent deactivated clients (`isActive: false`) from successfully completing PAR, Authorization, and Token exchange requests.
- **FR-006**: System MUST associate each client with a Unique Entity Number (UEN).
- **FR-007**: System MUST track whether a client (or its owning entity) has accepted the service agreement.
- **FR-008**: System MUST enforce a maximum of 5 staging test accounts per entity/UEN (Soft limit/Warning for mock environment).

### Key Entities *(include if feature involves data)*

- **Client**: Represents an OIDC client/application.
  - New Attributes: `allowedScopes`, `isActive`, `uen`, `siteUrl`, `appDescription`, `supportEmails`, `hasAcceptedAgreement`.
- **Entity**: Represents a Business Entity (identified by UEN).
  - Attributes: `uen`, `name`. (Note: Might be implicit in `Client` for now, but modeled as a relationship).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of PAR requests with unauthorized scopes are rejected with an `invalid_scope` error.
- **SC-002**: 100% of URLs containing IP addresses are rejected during client configuration or authentication.
- **SC-003**: 100% of authentication attempts from deactivated clients are blocked.
- **SC-004**: System successfully stores and retrieves all mandatory Singpass metadata (UEN, siteUrl, etc.) for registered clients.
- **SC-005**: All Redirect URLs in non-development environments use the `https://` protocol.
