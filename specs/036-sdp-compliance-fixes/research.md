# Research: SDP Compliance Fixes

**Feature**: 036-sdp-compliance-fixes  
**Status**: Complete

## Decision 1: JWKS Cache-Control Parsing
**Decision**: Implement a utility to parse `Cache-Control: max-age` and `Expires` headers. Fallback to 1 hour (3600s). Minimum TTL 60s.
**Rationale**: Mandatory requirement FR-008. Ensures the system respects the key rotation policy of the client.
**Alternatives considered**: 
- Static 1-hour cache: Rejected as it doesn't allow for faster key rotation if requested by the client.
- Always fetch: Rejected due to performance and reliability risks (SC-004).

## Decision 2: IP Address Restriction Logic
**Decision**: Use a robust regex pattern to detect IPv4 and IPv6 addresses in `redirect_uri` and `site_url`.
**Rationale**: Mandatory requirement FR-004.
**Pattern**:
- IPv4: `^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$` (applied to hostname)
- IPv6: standard IPv6 regex.
**Implementation**: Validation will be performed in a shared `AuthValidator` service.

## Decision 3: Application Name Retrieval Flow
**Decision**: Update `InitiateAuthSessionUseCase` to include `clientName` in the `SessionContext`.
**Rationale**: Ensures the frontend `login.astro` has immediate access to the app name without an extra API call during the login render.
**Alternatives considered**: 
- Frontend fetches client details: Rejected to avoid extra latency on the login page load.

## Decision 4: Staging Account Limit Enforcement
**Decision**: Implement a database count query in the `LinkUserToClientUseCase`.
**Rationale**: Simple and effective way to enforce the 100-account limit for 'Staging' clients (FR-007).
**Performance**: Count query on indexed `client_id` in the `user_accounts` table is efficient.

## Decision 5: Schema Extension for ClientConfig
**Decision**: Add 7 new columns to the `clients` table in SQLite.
**Rationale**: Addresses FR-005 and FR-006. Ensures all administrative data is persisted.
**Columns**: `client_name`, `jwks_uri`, `allowed_scopes` (JSON), `app_description`, `site_url`, `support_emails` (JSON), `environment`.
