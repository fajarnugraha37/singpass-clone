# Feature Specification: Singpass Implementation Conformance Auditor

**Feature Branch**: `028-singpass-implementation-check`  
**Created**: 2026-03-16  
**Status**: Draft  
**Input**: User description: "you are an auditor tool testing "singpass clone" conformance to the official singpass Login + myinfo integration & technical specs..."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Conformance Execution (Priority: P1)

As an auditor, I want to run the tool against a target Singpass clone implementation so that I can automatically verify its compliance with the core authentication flow (Discovery, PAR, PKCE/DPoP, Token Exchange, ID Token, Userinfo).

**Why this priority**: The core OIDC/FAPI conformance (PAR, token exchange, and JWT validation) forms the foundation of Singpass security. Verifying these endpoints is the highest priority for the auditor tool.

**Independent Test**: Can be fully tested by pointing the auditor tool at a mock or staging OIDC server and verifying that it successfully executes the end-to-end auth flow and generates a status report for each endpoint.

**Acceptance Scenarios**:

1. **Given** a target OIDC discovery URL, **When** the auditor tool executes the conformance suite, **Then** it fetches metadata and confirms all required endpoints exist.
2. **Given** a compliant target server, **When** the tool attempts an authorization flow, **Then** it successfully navigates PAR, token exchange, and Userinfo, reporting PASS for each step.
3. **Given** a non-compliant target server (e.g. failing ID token signature validation), **When** the tool evaluates the token, **Then** it logs a FAIL status with the raw decoded token as evidence.

---

### User Story 2 - Edge Case & Security Testing (Priority: P1)

As a security tester, I want the tool to simulate malicious inputs and edge cases (replay attacks, invalid tokens, mismatched redirect URIs) so that I can ensure the implementation robustly rejects unauthorized access.

**Why this priority**: Correctly rejecting invalid requests is critical to preventing account takeover and data breaches.

**Independent Test**: Can be independently tested by triggering individual negative test cases against the server without requiring a full end-to-end flow.

**Acceptance Scenarios**:

1. **Given** an existing, used authorization code, **When** the tool attempts a replay attack, **Then** the server must reject the request and the tool records a PASS.
2. **Given** a token exchange request, **When** the tool omits the PKCE code_verifier or provides an invalid DPoP proof, **Then** the server must fail properly (error codes per spec) and the tool records a PASS.

---

### User Story 3 - Config and Developer Portal Verification (Priority: P2)

As a compliance reviewer, I want the tool to verify the developer portal app configuration and MyInfo scope usage, so that I can ensure the implementation accurately enforces administrative controls, valid redirect URIs, and data minimization.

**Why this priority**: Proper client application registration and UX (consent, portal staging) are necessary for administrative security and privacy, though slightly secondary to the cryptographic checks.

**Independent Test**: Can be tested by providing the tool with app configuration exports or screenshots and verifying the tool parses and flags misconfigurations.

**Acceptance Scenarios**:

1. **Given** a client configuration with a wildcard redirect URI, **When** the tool analyzes the app settings, **Then** it flags the configuration as a FAIL due to missing exact-match validation.
2. **Given** a request for MyInfo data, **When** evaluating the requested scopes and consent flow, **Then** the tool verifies data minimization and prompts for manual review if human judgment is required for the UX consent screen.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST fetch and validate the target implementation's OIDC discovery document (`/.well-known/openid-configuration`), returning FAIL if required endpoints (authorization, token, userinfo, jwks, pushed_authorization_request) are missing.
- **FR-002**: System MUST verify that standard authorization requests (GET) are rejected or redirected, enforcing Pushed Authorization Request (PAR) and returning only `response_type=code`.
- **FR-003**: System MUST execute valid PAR POST requests and ensure the target responds with `request_uri`, `expires_in`, and enforces state/nonce requirements.
- **FR-004**: System MUST verify PKCE enforcement (S256) and correct token endpoint client authentication (client_secret or private_key_jwt).
- **FR-005**: System MUST perform token exchange using authorization codes, verifying DPoP-binding if configured, and validating the returned `id_token`'s signature, issuer, audience, and nonce against the JWKS endpoint.
- **FR-006**: System MUST ensure the `id_token` contains expected identity claims matching requested scopes (e.g., name, email, mobileno).
- **FR-007**: System MUST execute a userinfo request using the access token (and DPoP header if required), verifying that returned claims map to the requested scopes and that invalid tokens result in HTTP 401/403.
- **FR-008**: System MUST validate client registration properties, enforcing exact-match redirect URIs, 32-character alphanumeric client IDs, and token-based authentication method compliance.
- **FR-009**: System MUST verify MyInfo scopes adhere to data minimization, and prompt for manual review on operations requiring human judgement, such as consent UX and developer portal role gating.
- **FR-010**: System MUST conduct negative testing including replay attacks, mismatched redirect URIs, expired request URIs, and invalid client assertions, expecting proper error failures.
- **FR-011**: System MUST verify the target clone logs adequate metadata (client_id, state, nonce, request_uri, timestamps, auth result) without leaking raw secrets.
- **FR-012**: System MUST generate a final conformance report containing an executive summary (listing top 3 highest-risk findings first) and detailed results per check.
- **FR-013**: System MUST include the status (PASS/FAIL/PARTIAL), a concise finding, required evidence, remediation steps, and references mapping to the official Singpass doc URLs for each check in the report.
- **FR-014**: System MUST determine overall acceptance criteria: PASS (all HIGH/Critical pass, max 1 MEDIUM, no blocking LOWs), PARTIAL (1-2 mitigable HIGHs), or FAIL (any Critical issue present).

### Key Entities

- **Conformance Report**: The output document containing the executive summary, overall PASS/FAIL/PARTIAL status, and detailed findings per evaluation check.
- **Test Target (Clone)**: The Singpass-compatible server implementation being tested, consisting of standard OIDC endpoints (PAR, Auth, Token, Userinfo, JWKS) and Developer Portal configuration.
- **Evaluation Check**: An individual test case (e.g., PAR enforcement, PKCE validation) that produces a status, finding, evidence, remediation, and reference URL.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The auditor tool executes all automated checks (Discovery to Userinfo) against a target implementation in under 5 minutes without manual intervention.
- **SC-002**: The tool successfully detects and reports 100% of injected non-compliant flaws (e.g., weak redirect URI validation, replayable codes, invalid ID token signatures) as FAIL or PARTIAL.
- **SC-003**: The final conformance report unambiguously maps every finding to the corresponding official Singpass documentation reference URLs.
- **SC-004**: System evaluators can identify critical security gaps within 1 minute by reading the top 3 items in the generated executive summary.
- **SC-005**: All manual checks (consent UX, portal role gating) are successfully flagged in the tool's output for human review rather than silently skipped.