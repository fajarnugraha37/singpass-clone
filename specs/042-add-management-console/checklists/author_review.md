# Author Review Checklist: Vibe-Auth Developer & Admin Console

**Purpose**: Pre-implementation sanity check for the author focusing on Security, IAM, Mocks, and Recovery paths.
**Created**: 2026-04-05
**Feature**: [spec.md](../spec.md)

## Security & IAM Requirements

- [x] CHK001 - Are the OTP lifecycle states (generation, expiry timeframe, invalidation upon use) clearly quantified? [Completeness, Spec §FR-001]
- [x] CHK002 - Is the exact structure and validation rules for the OTP defined (e.g., numeric, 6-digits, alphanumeric)? [Clarity, Spec §FR-001]
- [x] CHK003 - Are the RBAC bounds explicitly mapped to exact permissions for 'developer' vs 'admin' rather than generally stated? [Completeness, Spec §FR-003]
- [x] CHK004 - Does the spec explicitly define authorization boundaries if a Developer attempts to revoke a session belonging to another Developer's client? [Edge Case, Spec §FR-008]
- [x] CHK005 - Are the requirements for secret rotation clear on whether existing active sessions are terminated immediately alongside the secret? [Consistency, Spec §FR-013]

## Data & Mocks Quality

- [x] CHK006 - Does the specification define exactly which subset of MyInfo attributes the Faker utility must generate to be considered "high-fidelity"? [Completeness, Spec §FR-006]
- [x] CHK007 - Is the conflict resolution behavior specified if the Faker utility generates an NRIC that already exists? [Coverage, Edge Case]
- [x] CHK008 - Are the audit log retention rules or data limits for `email_log` defined to prevent unbounded database growth? [Completeness, Spec §FR-010]
- [x] CHK009 - Are the parameters for the cursor-based pagination explicitly defined (e.g., default limit, max limit)? [Clarity, Spec §FR-012]

## Exception & Recovery Paths

- [x] CHK010 - Are the retry limits, lockouts, or cooldown periods specified for failed OTP login attempts? [Coverage, Security Gap]
- [x] CHK011 - Is the fallback/error behavior defined if the mock email service (or configured SMTP) fails to process or print the OTP? [Exception Flow, Spec §FR-010]
- [x] CHK012 - Are recovery or restoration requirements specified if an admin accidentally soft-deletes a critical OIDC client? [Recovery, Gap]
- [x] CHK013 - Does the spec define how the system behaves if global session revocation fails partially due to database timeouts? [Exception Flow, Gap]
- [x] CHK014 - Are the exact system responses/HTTP codes defined for when a revoked session attempts to make a subsequent request? [Completeness, Gap]
