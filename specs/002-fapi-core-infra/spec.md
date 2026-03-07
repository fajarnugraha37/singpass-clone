# Feature Specification: FAPI 2.0 Database Schema and Core Utilities

**Feature Branch**: `002-fapi-core-infra`  
**Created**: Sunday, 8 March 2026  
**Status**: Draft  
**Input**: User description: "**Goal**: Establish the Drizzle ORM SQLite schemas and core cryptographic utilities required for FAPI 2.0. Implement the Database Schema and Core Utilities for our Singpass FAPI 2.0 clone. Context Files: docs/singpass-server/02-pushed-authorization-request.md, docs/singpass-server/04-token-endpoint.md Requirements: 1. Define Drizzle ORM SQLite schemas for: Users, Sessions (tracking login state and 2FA), AuthorizationCodes, and PushedAuthorizationRequests (PAR). 2. Implement cryptographic utilities for FAPI 2.0: - JWKS management (generating/serving ES256 keys for signing ID tokens). - Validating client_assertion (private_key_jwt) against a mock client registry. - Validating DPoP (Demonstrating Proof-of-Possession) headers and binding them to tokens. 3. Add strict input validation and unit tests with >80% coverage."

## Clarifications

### Session 2026-03-08

- Q: What format should the PAR `request_uri` follow? → A: Sequential with Prefix (e.g., urn:ietf:params:oauth:request_uri:123)
- Q: What format should be used for tracking 2FA/assurance levels? → A: Singpass LOA (Level of Assurance): 1, 2
- Q: Where should the server's private keys (JWKS) be stored? → A: SQLite table `server_keys` (encrypted at rest)
- Q: How should `redirect_uri` validation be performed? → A: Full URI Match (Exact)
- Q: What is the maximum allowed age for a DPoP proof JWT? → A: 60 seconds (configurable)
- Q: How should security events (auth failures, DPoP errors) be logged? → A: Both (DB table for critical events, logs for all)
- Q: What is the enforcement policy for invalid DPoP proofs? → A: Fail fast: Immediate error (401/400)
- Q: What is the minimum key size for server private keys? → A: 2048-bit (Standard)
- Q: What is the behavior for unknown client IDs? → A: Fail fast: `invalid_client` error
- Q: How should multiple values for single-value parameters be handled? → A: Fail fast: `invalid_request` error

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Secure Client Authentication (Priority: P1)

As a Developer of a Client Application, I want to authenticate my client using FAPI 2.0 compliant `private_key_jwt` so that I can securely communicate with the Authorization Server without sending secrets over the wire.

**Why this priority**: Core security foundation for FAPI 2.0. Client authentication is the first step in any secure exchange.

**Independent Test**: Can be fully tested by submitting a valid signed JWT as a `client_assertion` to a validation utility and verifying it matches a public key in the mock registry.

**Acceptance Scenarios**:

1. **Given** a registered client with an ES256 public key, **When** a valid `client_assertion` signed by the corresponding private key is provided, **Then** the system successfully validates the client identity.
2. **Given** a `client_assertion` signed with an unknown key or an expired timestamp, **When** validated, **Then** the system rejects the request with a security error.

---

### User Story 2 - Pushed Authorization Request (PAR) Lifecycle (Priority: P1)

As a User, I want my sensitive authorization parameters (like scopes and claims) to be stored securely on the server before I am redirected to login, so that they cannot be viewed or modified in my browser's address bar.

**Why this priority**: FAPI 2.0 mandates PAR to eliminate "front-channel" tampering risks.

**Independent Test**: Can be tested by persisting a set of authorization parameters to the SQLite database and retrieving them via a unique `request_uri`.

**Acceptance Scenarios**:

1. **Given** a set of valid OAuth2 parameters, **When** pushed to the PAR storage utility, **Then** a unique `request_uri` is generated and a record is created in the database.
2. **Given** a PAR record exists, **When** retrieved using its `request_uri`, **Then** the returned data exactly matches the originally pushed parameters.

---

### User Story 3 - Session tracking with 2FA (Priority: P2)

As an Authorization Server, I need to track a user's progress through the login flow, including whether they have completed 2FA, so that I can issue tokens with the correct security level.

**Why this priority**: Singpass/FAPI flows are multi-step and require strict state management to ensure 2FA isn't bypassed.

**Independent Test**: Can be tested by creating a session record and updating its 2FA status, then verifying the persistence in the SQLite store.

**Acceptance Scenarios**:

1. **Given** an active user session, **When** 2FA is successfully completed, **Then** the session record is updated with the new assurance level (LOA: 1, 2).
2. **Given** a session without 2FA, **When** checked for high-security access, **Then** the system identifies it as insufficient.

---

### User Story 4 - DPoP Token Binding (Priority: P2)

As a Client Application, I want my tokens to be "sender-constrained" using DPoP, so that if a token is stolen, the thief cannot use it without also possessing my private key.

**Why this priority**: Critical FAPI 2.0 requirement for preventing token replay attacks.

**Independent Test**: Can be tested by binding a public key thumbprint to a session record and validating a DPoP proof against that binding.

**Acceptance Scenarios**:

1. **Given** an authorization request with a DPoP header, **When** a session is created, **Then** the public key from the DPoP header is bound to that session in the database.
2. **Given** a DPoP-bound session, **When** a token request is made with a different DPoP key, **Then** the system rejects the token issuance.

---

### Edge Cases

- **JWKS Key Rotation**: What happens to active sessions when a JWKS key is rotated? (Assumption: System should support multiple active keys in the JWKS to allow for a grace period).
- **PAR Expiration**: How does the system handle an authorization attempt using an expired `request_uri`? (Requirement: System MUST reject expired `request_uri`s with a 400 Bad Request).
- **DPoP JTI Reuse**: How does the system handle a DPoP proof with a `jti` that has already been used? (Requirement: System MUST reject reused `jti`s within the validity window to prevent replay).
- **Session Timeout**: What happens to bound 2FA state when a session expires? (Requirement: All state MUST be invalidated and the user MUST re-authenticate).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide Drizzle ORM schemas for SQLite including tables for: `users`, `sessions`, `auth_codes`, `par_requests`, `server_keys`, `security_audit_log`, and `used_jtis`.
- **FR-001.1**: Server keys in the `server_keys` table MUST be encrypted at rest using a master key from environment variables.
- **FR-002**: System MUST implement a JWKS management utility capable of generating and rotating ES256 key pairs.
- **FR-002.1**: Server ES256 keys MUST use a minimum of 2048-bit equivalent security (Standard P-256 curve).
- **FR-003**: System MUST provide a `private_key_jwt` validation utility that verifies signatures against a mock client registry.
- **FR-003.2**: Requests from client IDs not present in the registry MUST be rejected with an `invalid_client` error and logged.
- **FR-003.1**: The system MUST perform exact `redirect_uri` validation against the pre-registered client configuration.
- **FR-004**: System MUST implement DPoP validation including `jti` (JWT ID) uniqueness checks to prevent replay.
- **FR-004.1**: DPoP proofs MUST be rejected if the `iat` (issued at) claim is older than 60 seconds (configurable).
- **FR-004.2**: Any DPoP validation failure (signature, iat, jti, htm, htu) MUST result in an immediate `400` (for PAR) or `401` (for Token/UserInfo) error. No further processing is allowed.
- **FR-005**: System MUST support binding a DPoP public key thumbprint to `sessions` and `auth_codes` in the database.
- **FR-006**: System MUST enforce Zod-based (or similar) input validation for all data entering the schema layer.
- **FR-006.1**: Request parameters MUST be validated for single-value presence (except where arrays are allowed by specification). Multiple values for single-value parameters MUST result in an `invalid_request` error.
- **FR-007**: System MUST provide a mock client registry implementation (e.g., static configuration) for development and testing.
- **FR-008**: System MUST log all security-critical events (authentication success/failure, PAR creation, DPoP validation errors) to both structured application logs and a persistent `security_audit_log` database table.

### Key Entities *(include if feature involves data)*

- **User**: Represents the subject being authenticated (e.g., NRIC, name).
- **Session**: A record of an active authentication attempt, tracking 2FA completion (LOA: 1, 2) and DPoP bindings.
- **AuthorizationCode**: A one-time-use secret linked to a PAR and a Session.
- **PushedAuthorizationRequest (PAR)**: A short-lived storage of authorization parameters identified by a sequential `request_uri` with a prefix (e.g., `urn:ietf:params:oauth:request_uri:123`).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All cryptographic validation operations (DPoP, private_key_jwt) must complete in under 50ms.
- **SC-002**: 100% of database schemas are successfully migrated and verified against the Drizzle ORM definitions.
- **SC-003**: Code coverage for the `fapi-core-infra` package must be at least 80% as reported by the test runner.
- **SC-004**: 100% of invalid DPoP proofs (expired, wrong URI, reused JTI) are correctly identified and rejected.

## Assumptions

- **A-001**: ES256 is the only required signing algorithm for this phase (per FAPI 2.0 recommendations).
- **A-002**: The mock client registry is sufficient for initial development and does not require a dedicated database table yet.
- **A-003**: PAR requests have a default TTL (Time-To-Live) of 5 minutes.
