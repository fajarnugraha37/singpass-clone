# Feature Specification: Mock Client Registry — Add Encryption Key

**Feature Branch**: `021-mock-client-enc-key`  
**Created**: 2026-03-15  
**Status**: Draft  
**Input**: User description: "Mock Client Registry — Add Encryption Key **Finding**: #10 (🟡 Medium) ### Problem `mock-client-id` in the client registry only has a signature key but no encryption key, causing ID Token generation to fail. ### Acceptance Criteria 1. `mock-client-id` MUST have both a `sig` key (ES256) and an `enc` key (ECDH-ES+A256KW). 2. Token exchange for `mock-client-id` MUST succeed without `"Client public encryption key not found"` error."

## Clarifications

### Session 2026-03-15

- Q: How should the encryption key for the mock client be provided? → A: Static hardcoded key defined in the configuration.
- Q: Where is the client registry currently defined? → A: Stored as an in-memory TypeScript object in `apps/backend/src/infra/adapters/client_registry.ts`.
- Q: What is the expected format of the ID Token after successful exchange? → A: ID Token MUST be returned as a JWE (JSON Web Encryption) object.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Successful Token Exchange for Mock Client (Priority: P1)

As a developer testing the OIDC flow, I want `mock-client-id` to have a valid encryption key in the registry so that I can successfully complete the token exchange flow when encryption is required.

**Why this priority**: High. This is a blocker for testing any flow that involves `mock-client-id` and requires ID Token encryption.

**Independent Test**: Can be fully tested by initiating a token exchange request for `mock-client-id` and verifying that the ID Token is generated without "Client public encryption key not found" errors.

**Acceptance Scenarios**:

1. **Given** the system is configured with a mock client registry, **When** the registry for `mock-client-id` is inspected, **Then** it MUST contain both a signature key (`sig`) and an encryption key (`enc`).
2. **Given** a valid authorization code for `mock-client-id`, **When** a token exchange request is initiated, **Then** the system MUST successfully generate an ID Token using the client's encryption key.

---

### Edge Cases

- **Missing Encryption Key**: If the encryption key is missing (current state), the system handles it by failing with a "Client public encryption key not found" error.
- **Algorithm Mismatch**: If the provided encryption key does not match the expected algorithm (`ECDH-ES+A256KW`), the token generation might fail or produce an invalid token.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST update the `mock-client-id` entry in the client registry configuration file to include a static, hardcoded encryption key (`enc`).
- **FR-002**: The encryption key for `mock-client-id` MUST use the `ECDH-ES+A256KW` algorithm.
- **FR-003**: The existing signature key (`sig`) for `mock-client-id` MUST be preserved and use the `ES256` algorithm.
- **FR-004**: System MUST successfully resolve the public encryption key for `mock-client-id` during the token exchange process.
- **FR-005**: System MUST return the ID Token as a JWE (JSON Web Encryption) object when the client registry includes an `enc` key.

### Key Entities *(include if feature involves data)*

- **Client Registry**: A repository of OIDC client configurations, including their identifiers and public keys.
- **Mock Client (`mock-client-id`)**: A specific client used for development and testing purposes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of token exchange requests for `mock-client-id` succeed without "Client public encryption key not found" errors.
- **SC-002**: The `mock-client-id` registry entry contains a valid `enc` key compatible with `ECDH-ES+A256KW`.
- **SC-003**: ID Tokens generated for `mock-client-id` are correctly encrypted when the protocol requires it.
