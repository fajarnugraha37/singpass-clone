# Feature Specification: Singpass Clone Production Hardening

**Feature Branch**: `029-singpass-hardening`  
**Created**: 2026-03-16  
**Status**: Draft  
**Input**: User description: "You are a senior security engineer responsible for bringing a Singpass clone implementation to production readiness. Your task is to automatically detect incomplete, mocked, or simplified implementations and replace them with correct implementations aligned with the Singpass specifications. REFERENCE SPECIFICATION Use the following documentation as the authoritative reference when implementing fixes: Singpass Login <https://docs.developer.singpass.gov.sg/docs/products/singpass-login> Singpass MyInfo <https://docs.developer.singpass.gov.sg/docs/products/singpass-myinfo> Integration Guide Authorization Request Handling Redirect Token Exchange Parsing ID Token Requesting UserInfo Technical Concepts JWKS PKCE Client Assertion DPoP OIDC Discovery PROCESS Follow the steps strictly. --- STEP 1 — Scan the Repository Search the entire repository for indicators of incomplete or mocked implementations. Search patterns: TODO FIXME TBD NOT_IMPLEMENTED HACK TEMP PLACEHOLDER SIMPLIFIED MOCK STUB Also search for suspicious implementation shortcuts such as: hardcoded users hardcoded NRIC values fake tokens static JWT secrets skipped validation checks always-true authentication logic Example patterns: return 'test-user' return success jwt.sign(payload, 'secret') if (devMode) bypassAuth() redirectUri.startsWith() nonceCheck = true Report every match with: file path line number code snippet --- STEP 2 — Determine Intended Behaviour For each placeholder or simplified implementation: Determine what the correct behaviour should be according to the Singpass specifications. Examples: If a TODO appears in PKCE validation logic → implement proper code_verifier verification. If a mock JWT is generated → implement signed JWT using server private key. If userinfo endpoint returns static data → implement scope-based attribute retrieval. --- STEP 3 — Replace Placeholder Logic Replace incomplete code with correct implementations. Examples of expected replacements: Authorization Endpoint - enforce response_type = code - validate state parameter - store nonce - support PAR request_uri PKCE - validate S256 code_challenge - verify code_verifier during token exchange Token Endpoint - enforce authorization_code single use - verify redirect_uri matches registered URI - support client_assertion authentication ID Token - include iss, sub, aud, exp, iat, nonce - sign using private key - publish verification keys via JWKS JWKS - implement endpoint returning current public keys - include kid identifiers UserInfo - validate access_token - enforce scopes - return only permitted attributes MyInfo - require user consent - filter attributes based on scope --- STEP 4 — Remove Dangerous Shortcuts Eliminate insecure development shortcuts such as: devMode authentication bypass hardcoded credentials static tokens disabled validation flags Replace them with secure equivalents. --- STEP 5 — Refactor Test-Only Logic If mocks are required for automated tests: Move them into: /test /tests /mocks Ensure production code does not depend on mock behaviour. --- STEP 6 — Add Missing Security Enforcement Ensure the following invariants exist: authorization codes are single-use nonce is validated during ID token verification state is verified during redirect handling redirect_uri must match exactly JWT signatures are verified using JWKS client_assertion JWTs are validated DPoP proof is validated if enabled --- STEP 7 — Add Compliance Tests Create tests verifying the corrected behaviour. Required tests: PKCE verification failure authorization code replay attack invalid redirect_uri rejection invalid nonce detection invalid client_assertion rejection invalid token access to userinfo --- OUTPUT FORMAT Produce results in this structure: SECTION 1 — Detected Placeholder / Mock Implementations List every location where incomplete logic was found. SECTION 2 — Fix Implementations For each finding provide: problem description file path original code snippet corrected implementation SECTION 3 — Security Improvements Explain how the fixes improve compliance with Singpass specs. SECTION 4 — Added Tests List new tests verifying correct behaviour. SECTION 5 — Final Status Summarize whether the implementation is now compliant or still requires manual review."

## Clarifications

### Session 2026-03-16
- Q: What is the level of remediation automation for the hardening tool? → A: Fully Automated (Tool automatically detects and replaces all patterns without intervention).
- Q: What is the scope of automated replacements? → A: Hybrid (Resolve placeholders and add missing security headers/generic FAPI checks to all endpoints).
- Q: How should ambiguous placeholders (e.g., `// TODO: fix this`) be handled? → A: Spec-First (Automatically implement the Singpass-standard behavior for the given path).
- Q: Where should the hardened logic retrieve cryptographic keys and sensitive credentials? → A: Environment Variables (Retrieve secrets/keys from system environment variables).
- Q: Where should authentication-related state (sessions, PAR requests) be persisted? → A: SQLite Database (Persist all auth-related state in the monorepo's shared SQLite database).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Security Audit and Remediation (Priority: P1)

As a security engineer, I want to scan the codebase for mocks and have them automatically replaced with production-ready logic based on the Singpass specification, while also proactively refactoring OIDC endpoints to include missing security headers and FAPI checks, so that the system adheres to the official Singpass OIDC/FAPI 2.0 specifications without manual intervention.

**Why this priority**: Security is the paramount concern for an identity provider. Mocks and placeholders represent vulnerabilities that must be resolved before production deployment.

**Independent Test**: Can be tested by running the scan tool and verifying that all detected placeholders in core authentication paths are replaced with valid, functional code and that all endpoints now include required FAPI security headers (e.g., `Cache-Control: no-store`, `Pragma: no-cache`).

**Acceptance Scenarios**:

1. **Given** a codebase containing `TODO` comments in the PKCE validation logic, **When** the hardening process is run, **Then** the `TODO` is replaced with a functional S256 code_challenge verification.
2. **Given** an ambiguous placeholder like `// TODO: fix this` inside the Token Endpoint, **When** the hardening process is run, **Then** the tool defaults to implementing the standard OIDC token validation logic for that specific endpoint.
3. **Given** a mock JWT generation using a static "secret", **When** the system is hardened, **Then** it uses a secure private key for signing (retrieved from an environment variable) and publishes the public key via JWKS.
4. **Given** an OIDC endpoint missing FAPI-mandated security headers, **When** the system is hardened, **Then** the endpoint is automatically refactored to include `Cache-Control: no-store`.

---

### User Story 2 - Compliance Enforcement (Priority: P1)

As a system administrator, I want the system to enforce strict security invariants (code single-use, exact redirect matching, nonce validation) and persist all session state in a durable database so that it is robust against common OIDC/OAuth2 attacks and server restarts.

**Why this priority**: Protocol invariants and persistent state are critical for preventing replay attacks, token leakage, and unauthorized access while maintaining system availability.

**Independent Test**: Can be tested by attempting various attacks (e.g., replaying an authorization code) or restarting the server during an active flow and verifying that the system correctly rejects attacks and maintains session integrity.

**Acceptance Scenarios**:

1. **Given** a used authorization code, **When** a token exchange is attempted again, **Then** the system MUST reject the request.
2. **Given** a redirect_uri that only partially matches the registered one (e.g., starts with), **When** an authorization request is made, **Then** the system MUST return a validation error.
3. **Given** an ID Token verification, **When** the nonce in the token does not match the one stored during authorization, **Then** the verification MUST fail.
4. **Given** an active PAR request, **When** the server restarts before the code is exchanged, **Then** the `request_uri` MUST still be valid for the duration of its expiry.

---

### User Story 3 - MyInfo Data Minimization (Priority: P2)

As a privacy-conscious user, I want the system to return only the specific MyInfo attributes I have consented to, so that my personal data is shared according to the principle of least privilege.

**Why this priority**: Data minimization is a core requirement of the MyInfo specification and essential for user trust and regulatory compliance.

**Independent Test**: Can be tested by requesting various combinations of scopes and verifying that the UserInfo response contains only the attributes associated with those specific scopes.

**Acceptance Scenarios**:

1. **Given** an authorization for `openid profile`, **When** the UserInfo endpoint is called, **Then** it returns profile data but NO private MyInfo attributes (e.g., NRIC).
2. **Given** an authorization for a specific MyInfo attribute (e.g., `birthcountry`), **When** the UserInfo endpoint is called, **Then** it returns that attribute only if consent was granted.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST implement a "discovery" scan to identify all `TODO`, `MOCK`, `FIXME`, and suspicious implementation shortcuts (hardcoded users, static secrets, bypassAuth flags).
- **FR-002**: System MUST automatically replace detected placeholders and mocks with production-grade logic that adheres to Singpass specifications.
- **FR-003**: System MUST proactively refactor all OIDC/FAPI endpoints to enforce required security headers (e.g., `Cache-Control: no-store`, `Pragma: no-cache`) and FAPI-mandated invariants.
- **FR-004**: System MUST default to Singpass-standard behavior when encountering ambiguous placeholders in OIDC/MyInfo code paths (e.g., assuming a TODO in the auth path requires full protocol enforcement).
- **FR-005**: Authorization Endpoint MUST enforce `response_type=code`, validate the `state` parameter, and support the Pushed Authorization Request (PAR) `request_uri`.
- **FR-006**: System MUST implement S256 PKCE validation, verifying the `code_verifier` during the token exchange phase.
- **FR-007**: Token Endpoint MUST enforce that authorization codes are single-use and that the `redirect_uri` matches the registered URI exactly.
- **FR-008**: ID Tokens MUST include standard claims (`iss`, `sub`, `aud`, `exp`, `iat`, `nonce`) and be signed using a secure private key.
- **FR-009**: System MUST expose public verification keys via a standard JWKS (`/.well-known/jwks.json`) endpoint with unique `kid` identifiers.
- **FR-010**: UserInfo and MyInfo endpoints MUST validate the `access_token` and return only those attributes permitted by the authorized scopes.
- **FR-011**: System MUST implement DPoP proof validation if DPoP is enabled for the client.
- **FR-012**: System MUST remove all "dangerous shortcuts" (e.g., `devMode` bypasses, hardcoded credentials) and replace them with secure, production-grade logic.
- **FR-013**: System MUST retrieve all cryptographic keys and sensitive credentials (e.g., JWT signing keys, client secrets) exclusively from environment variables in the hardened production code.
- **FR-014**: System MUST persist all authentication-related state (including PAR request data, state, nonces, and session identifiers) in the monorepo's shared SQLite database.
- **FR-015**: All mock implementations required for testing MUST be relocated to `/tests` or `/mocks` and must not be used in the production execution path.

### Key Entities

- **Auth Session**: Persistent storage (in SQLite) of `state`, `nonce`, and `code_challenge` during the authorization flow.
- **Authorization Code**: A short-lived, single-use token exchanged for an ID Token and Access Token.
- **JWKS (JSON Web Key Set)**: A set of public keys used by clients to verify the signature of ID Tokens.
- **MyInfo Attribute**: A discrete piece of user data (e.g., name, address) protected by specific OIDC scopes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of detected placeholders (`TODO`, `MOCK`, `FIXME`) in the production OIDC/FAPI paths are automatically resolved and replaced with functional code, defaulting to Singpass standards for ambiguous cases.
- **SC-002**: 100% of OIDC endpoints successfully implement mandatory FAPI security headers and basic request validation logic.
- **SC-003**: The implementation successfully passes all 7 mandatory compliance tests (PKCE failure, replay attack, invalid redirect, invalid nonce, invalid client_assertion, invalid token access).
- **SC-004**: Zero "devMode" or "bypassAuth" flags are present in the final production-ready codebase.
- **SC-005**: 100% of production secrets and keys are retrieved from environment variables, with no hardcoded values remaining in OIDC paths.
- **SC-006**: 100% of authentication flow state is persistent and survives server restarts (verified via SQLite inspection).
- **SC-007**: ID Token validation (using published JWKS) succeeds for 100% of validly issued tokens across all supported signature algorithms.

### Assumptions

- **A-001**: MyInfo data will be sourced from a mock/local database for this clone, but with correct scope-based filtering logic implemented.
- **A-002**: A single secure static keypair is sufficient for the initial "production-ready" JWKS implementation, with support for rotation deferred to a later feature. Cryptographic keys are loaded from environment variables.
- **A-003**: The codebase has sufficient structural maturity to support the replacement of these logic components without a full architectural rewrite.
