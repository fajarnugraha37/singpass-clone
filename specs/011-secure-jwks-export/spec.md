# Feature Specification: Secure JWKS Public Key Export

**Feature Branch**: `011-secure-jwks-export`  
**Created**: 14 March 2026
**Status**: Draft  
**Input**: User description: "JWKS Public Key Export Security Audit **Finding**: #1 (🔴 Critical) ### Problem `getPublicJWKS()` in `JoseCryptoService` calls `jose.exportJWK(privateKey)` which may include the private key component `d` in the output. The key is imported with `{ extractable: true }`, increasing risk. ### Acceptance Criteria 1. `GET /.well-known/keys` MUST return JWK objects containing ONLY public key components: `kty`, `crv`, `x`, `y`, `kid`, `use`, `alg`. 2. The `d` (private key) component MUST NOT be present in any key returned by the JWKS endpoint. 3. A unit test MUST explicitly assert that `d` is absent from every key in the exported JWKS."

## User Scenarios & Testing *(mandatory)*

This is a security hardening task. The primary "user" is a client application consuming the JWKS endpoint, and the secondary "user" is a security auditor verifying compliance.

### User Story 1 - Secure Public Key Retrieval (Priority: P1)

As a client application, I need to retrieve public keys from the `/.well-known/keys` endpoint without any private components, so that I can securely validate tokens without any exposure to sensitive key material.

**Why this priority**: This is a critical security requirement to prevent private key leakage.

**Independent Test**: The JWKS endpoint can be requested, and its response can be validated against security requirements, independent of any other application functionality.

**Acceptance Scenarios**:

1. **Given** the authentication service has generated and loaded its cryptographic keys, **When** a client or auditor makes a GET request to the `/.well-known/keys` endpoint, **Then** the HTTP response is successful and contains a valid JWK Set.
2. **Given** a valid JWK Set is returned from the endpoint, **When** an auditor inspects the JSON payload, **Then** each JWK object in the `keys` array MUST NOT contain the `d` (private key) parameter.
3. **Given** a new unit test for the JWKS endpoint, **When** the test suite is run, **Then** the test MUST explicitly assert that the `d` parameter is absent from all keys in the fetched JWK Set and the test MUST pass.

### Edge Cases

- **What happens when no keys are configured?** The endpoint should return a valid, empty JWK Set: `{"keys":[]}`.
- **How does the system handle an error during key export?** The service should log a critical error and fail to start or return an appropriate server error at the endpoint, but it must not expose a partially-formed or insecure key.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST expose a public endpoint at `/.well-known/keys` for serving JSON Web Keys.
- **FR-002**: The JSON payload returned from this endpoint MUST be a valid JSON Web Key Set (JWKS) compliant with RFC 7517.
- **FR-003**: The key export mechanism MUST ensure that only public key components (`kty`, `crv`, `x`, `y`, `kid`, `use`, `alg`, etc.) are included in the JWKS.
- **FR-004**: The system MUST explicitly prevent the private key component `d` from being included in the JWKS response under any circumstances.
- **FR-005**: A dedicated unit test MUST be implemented to programmatically fetch the JWKS and assert the absence of the `d` parameter in every key.

### Key Entities *(include if feature involves data)*

- **JSON Web Key (JWK)**: A JSON data structure that represents a cryptographic key. This feature concerns the secure representation of public keys within a JWK Set.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new, passing unit test exists that specifically asserts the `d` (private key) component is `undefined` or absent for every key in the `/.well-known/keys` endpoint response.
- **SC-002**: Manual verification of the `/.well-known/keys` endpoint on a local development server confirms that no private key components are exposed in the raw JSON output.
- **SC-003**: Automated security scanning tools targeting known JWKS misconfigurations report zero findings for private key exposure on this endpoint.
