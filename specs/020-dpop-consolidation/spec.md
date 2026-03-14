# Feature Specification: DPoP Validator Consolidation

**Feature Branch**: `020-dpop-consolidation`  
**Created**: 2026-03-15  
**Status**: Draft  
**Input**: User description: "DPoP Validator Consolidation Finding: #9 (High). Problem: Three separate DPoP validation implementations exist with inconsistencies. Goal: Consolidate into ONE DPoPValidator in core/utils/dpop_validator.ts with strict htu and jti replay protection."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Secure Token Exchange with DPoP (Priority: P1)

As a client application, I want my DPoP proofs to be strictly validated during token exchange so that my session is protected against URI mismatch and replay attacks.

**Why this priority**: Token exchange is the most critical point for DPoP binding. Relaxed validation here compromises the security of the entire flow.

**Independent Test**: Can be tested by attempting a token exchange with a DPoP proof where the `htu` claim does not exactly match the token endpoint URI, or by re-using a `jti` within the replay window.

**Acceptance Scenarios**:

1. **Given** a token exchange request, **When** the DPoP proof `htu` claim is an exact match for the endpoint URI, **Then** the proof is accepted (provided other claims are valid).
2. **Given** a token exchange request, **When** the DPoP proof `htu` claim is NOT an exact match (e.g., missing trailing slash or different case), **Then** the proof is rejected.
3. **Given** a successfully used DPoP proof, **When** the same proof is used again with the same `jti`, **Then** it is rejected as a replay.

---

### User Story 2 - Consistent Security across OIDC Endpoints (Priority: P2)

As a security auditor, I want all DPoP-enabled endpoints to use the exact same validation logic so that there are no "weak links" in the system's security posture.

**Why this priority**: Inconsistency leads to vulnerabilities where an attacker might bypass security on one endpoint even if others are secure.

**Independent Test**: Can be verified by running the same set of "invalid proof" tests against PAR, Token, and UserInfo endpoints and confirming they all fail with the same strictness.

**Acceptance Scenarios**:

1. **Given** any DPoP-protected endpoint (PAR, Token, UserInfo), **When** a proof with a re-used `jti` is presented, **Then** the system rejects it consistently.
2. **Given** any DPoP-protected endpoint, **When** a proof with relaxed `htu` (e.g., partial path) is presented, **Then** the system rejects it consistently.

---

### Edge Cases

- **HTU Normalization**: What happens when the request URI contains query parameters or fragments? (System MUST match the base URI exactly as per RFC 9449).
- **JTI Replay Window**: How long is the `jti` tracked? (System MUST enforce a replay window consistent with the DPoP proof's `iat` window).
- **Missing Claims**: How are proofs without `htu` or `jti` handled? (System MUST reject proofs missing mandatory DPoP claims).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST have exactly one DPoP validation implementation located in `apps/backend/src/core/utils/dpop_validator.ts`.
- **FR-002**: System MUST use this unified `DPoPValidator` for PAR, Token, and UserInfo endpoints.
- **FR-003**: System MUST perform strict `htu` (HTTP URI) validation (exact match) in all DPoP proof checks.
- **FR-004**: System MUST enforce `jti` (JWT ID) replay protection for all DPoP proofs.
- **FR-005**: `apps/backend/src/core/utils/dpop.ts` MUST be deleted.
- **FR-006**: `CryptoService.validateDPoPProof()` MUST be removed from both the interface and its implementation in `apps/backend/src/infra/adapters/jose_crypto.ts`.

### Key Entities *(include if feature involves data)*

- **DPoPProof**: A JWT containing `htu` (HTTP URI), `htm` (HTTP Method), `jti` (JWT ID), and `iat` (Issued At) claims, bound to a public key.
- **JTI Store**: A persistence mechanism (implemented via SQLite/Drizzle with TTL pruning) used to track used `jti` values globally to prevent replays across all endpoints.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of DPoP validation logic is centralized in `DPoPValidator`.
- **SC-002**: Zero instances of `htu` relaxed checking remain in the codebase.
- **SC-003**: 100% of requests to DPoP-protected endpoints (PAR, Token, UserInfo) with re-used `jti` are rejected within the replay window.
- **SC-004**: Code cleanup results in the deletion of `dpop.ts` and removal of `validateDPoPProof` from `CryptoService`.
