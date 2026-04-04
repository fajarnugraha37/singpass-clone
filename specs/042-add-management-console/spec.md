# Feature Specification: Vibe-Auth Developer & Admin Console

**Feature Branch**: `042-add-management-console`  
**Created**: 2026-04-05  
**Status**: Draft  
**Input**: User description: "Implement the \"Vibe Management Console\"—a unified Developer Portal and Admin Dashboard for the vibe-auth monorepo..."

## Clarifications

### Session 2026-04-05
- Q: Which primary authentication method should be implemented for Developer accounts? → A: OTP (One-Time Password via Email). Email sending will be mocked by default (configurable to SMTP), the OTP will be printed to the console, and all email sending will be audited into an `email_log` table.
- Q: How should active sessions be handled when a client is soft-deleted? → A: Automatically revoke all active sessions immediately.
- Q: Is server-side pagination required for the initial implementation of the Admin God Mode dashboard? → A: Yes, assume high volume (>1000 items) and implement server-side, cursor-based pagination and search.
- Q: When rotating client secrets, how should the old secret be handled? → A: Invalidate immediately (strict security).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Developer Self-Service Registration & Client Management (Priority: P1)

As a Developer, I want to register for an account, log in, and manage my OIDC clients (create, update, activate, deactivate) so that I can independently integrate my applications with the platform.

**Why this priority**: Enabling developers to self-service their integrations is the core value proposition of the portal and reduces operational overhead.

**Independent Test**: Can be fully tested by registering a new developer account, logging in, creating a client with specific scopes and JWKS, and verifying those settings persist.

**Acceptance Scenarios**:

1. **Given** an unregistered user, **When** they complete the registration and login process, **Then** they are granted access to the developer dashboard.
2. **Given** a logged-in developer, **When** they create a new OIDC client with valid configurations (callback URIs, scopes), **Then** the client is created, synced to the OIDC provider, and listed in their dashboard.

---

### User Story 2 - Admin Global Oversight & Revocation (Priority: P1)

As an Administrator, I want to view and manage all developer accounts, OIDC clients, and active sessions across the platform so that I can maintain security, troubleshoot issues, and revoke compromised access.

**Why this priority**: Global oversight is critical for platform security and operational support.

**Independent Test**: Can be tested by logging in as an Admin, viewing all registered entities, and successfully revoking an active session of a specific client.

**Acceptance Scenarios**:

1. **Given** an authenticated Admin, **When** they navigate to the "God Mode" dashboard, **Then** they can view comprehensive lists of all developers, clients, and active sessions.
2. **Given** an authenticated Admin, **When** they revoke a specific active session, **Then** the session is terminated immediately platform-wide.

---

### User Story 3 - Singpass Sandbox Data Generation (Priority: P2)

As an Administrator, I want to generate high-fidelity synthetic MyInfo attributes for Sandbox users so that I can effectively test integration flows without using real PII.

**Why this priority**: Crucial for testing and compliance, though less critical than basic IAM and client management.

**Independent Test**: Can be tested by using the "Faker" utility in the UI to populate a Sandbox user's profile and verifying the generated NRIC, name, and address follow valid formats.

**Acceptance Scenarios**:

1. **Given** an Admin configuring a Singpass Sandbox user, **When** they use the Data Factory utility, **Then** valid, synthetic Singaporean identity data is populated into the user's profile.

### Edge Cases

- How does the system handle concurrent edits to a client configuration by an Admin and the owning Developer?
- What happens if the Data Factory generates an NRIC that conflicts with an existing Sandbox user?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a Developer registration, login, and password reset flow using OTP (One-Time Password) via Email. OTPs MUST be 6-digit numeric codes, valid for 10 minutes, and invalidated immediately upon use or after 3 failed verification attempts.
- **FR-002**: System MUST seed default Admin and Developer accounts (`password: test1234`) and 10 Sandbox users during environment hydration.
- **FR-003**: System MUST enforce Role-Based Access Control (RBAC):
    - **Developer**: Can perform CRUD on own OIDC clients, view own active sessions, and revoke own sessions.
    - **Admin**: Has "God Mode" access to all Developer accounts, all OIDC clients, all active sessions (global revocation), and Singpass Sandbox user management.
- **FR-004**: System MUST allow Developers to perform CRUD operations on their own OIDC clients (client_id, client_name, jwks_uri, redirect_uris, allowed_scopes, grant_types).
- **FR-005**: System MUST allow Administrators to perform global CRUD on all Developer accounts, OIDC clients, and Singpass Sandbox users.
- **FR-006**: System MUST provide a "Faker" utility for generating realistic Singaporean identity data (Name, NRIC, Birth Date, Address, Gender, Race, Nationality) for Sandbox users. If a generated NRIC conflicts with an existing user, the utility MUST retry generation up to 5 times.
- **FR-007**: System MUST provide a Session Inspector to view granular details of active sessions (Client ID, User Sub, Scopes, IAT/EXP).
- **FR-008**: System MUST allow Developers to revoke sessions for their own clients, and Admins to revoke any session globally. Access attempts with a revoked session MUST return a 401 Unauthorized error with a `session_revoked` indicator.
- **FR-009**: System MUST ensure client configuration changes are immediately available to the OIDC backend provider.
- **FR-010**: System MUST support mocked email sending by default (with SMTP configuration option), print OTPs to the console when mocked, and audit all email sending events into an `email_log` table. Logs older than 30 days MAY be pruned.
- **FR-011**: System MUST automatically revoke all active sessions immediately when an OIDC client is soft-deleted or deactivated. Soft-deleted clients MUST be restorable only by an Admin.
- **FR-012**: System MUST implement server-side, cursor-based pagination and search for all list views in the Admin God Mode dashboard. Default limit: 20, Max limit: 100.
- **FR-013**: System MUST immediately invalidate old client secrets when a Developer rotates them, offering no grace period.
- **FR-014**: System MUST implement security cooldowns: 5 failed OTP attempts for an email within 1 hour results in a 15-minute lockout for that email.

### Key Entities *(include if feature involves data)*

- **Developer**: Represents a portal user who owns and manages OIDC clients. Attributes: ID, email, role, status.
- **OIDC Client**: Represents a registered application. Attributes: client_id, developer_id, JWKS, scopes, redirect URIs, status.
- **Singpass Sandbox User**: Represents a synthetic user for testing. Attributes: NRIC, MyInfo attributes, credentials.
- **Session**: Represents an active OIDC/FAPI session. Attributes: session_id, client_id, user_sub, scopes, timestamps.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new developer can register, create a client, and view its configuration in under 3 minutes.
- **SC-002**: The "Faker" utility generates 100% syntactically valid synthetic NRICs and MyInfo payloads.
- **SC-003**: Session revocation by an Admin terminates the targeted session and prevents further access within 1 second.
- **SC-004**: Environment seeding script successfully provisions all required entities (Admin, Developer, 10 Sandbox users) within 10 seconds of execution.