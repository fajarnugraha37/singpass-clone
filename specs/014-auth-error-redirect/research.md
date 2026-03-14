# Research: Auth Error Redirect Compliance

## Decisions

### 1. Data Model Extension
- **Decision**: Add `retryCount` integer column to `auth_sessions` table.
- **Rationale**: Essential for tracking failed authentication attempts (password and OTP) within a single session context as required by FR-001.
- **Implementation**: Update `apps/backend/src/infra/database/schema.ts`, `apps/backend/src/core/domain/session.ts`, and `DrizzleAuthSessionRepository`.

### 2. Terminal Failure Logic in Use Cases
- **Decision**: `ValidateLoginUseCase` and `Validate2FAUseCase` will handle retry incrementing and terminal state transition.
- **Rationale**: Centralizes business logic for authentication failure policies.
- **Behavior**: 
  - On failure: `retryCount++`.
  - If `retryCount >= 3`: `status = 'FAILED'`.
  - Log `AUTH_TERMINAL_FAILURE` via `SecurityAuditService`.

### 3. OIDC Compliant Redirects
- **Decision**: Backend issues direct 302 redirect for terminal failures; Frontend detects and navigates.
- **Rationale**: Fulfills the "Direct redirect" requirement while allowing the frontend (Hono RPC/fetch) to handle the navigation if needed.
- **Implementation**: 
  - Controller fetches PAR payload via `parRepository` to get `redirect_uri` and `state`.
  - Controller returns `c.redirect(`${redirect_uri}?error=login_required&state=${state}`)`.
  - Frontend components (`LoginForm`, `TwoFactorForm`) will be updated to check `res.redirected` or handle the 302 gracefully.

### 4. IP-Based Rate Limiting
- **Decision**: Implement a custom Hono middleware for IP-based throttling.
- **Rationale**: Protects against automated brute-force attacks (FR-008) without adding heavy external dependencies for the MVP.
- **Mechanism**: In-memory map of `IP -> { count, resetAt }`.

### 5. Security Audit Logging
- **Decision**: Utilize existing `DrizzleSecurityAuditService`.
- **Rationale**: Already follows the "Secrets NEVER logged" constitution principle and persists to SQLite.
- **Event**: New event type `AUTH_TERMINAL_FAILURE` with details: `{ sessionId, userId, reason, ipAddress }`.

## Alternatives Considered
- **Frontend-only redirect**: Rejected during clarification session in favor of backend-driven 302.
- **Redis for Rate Limiting**: Deferred. SQLite/In-memory is sufficient for the current scale and monorepo setup.

## Unknowns Resolved
- **Retry tracking**: Confirmed `auth_sessions` as the correct entity to hold this state.
- **Redirect URI source**: Confirmed it must be retrieved from the original PAR request linked to the session.
