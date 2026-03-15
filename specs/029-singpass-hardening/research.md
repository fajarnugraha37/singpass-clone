# Research: Singpass Implementation Hardening

## FAPI 2.0 Security Headers in Hono
- **Decision**: Implement a custom Hono middleware to inject standard security headers.
- **Rationale**: Ensures consistency across all OIDC endpoints and simplifies automated refactoring (only one middleware needs to be attached).
- **Required Headers**:
  - `Cache-Control: no-store`
  - `Pragma: no-cache`
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Content-Security-Policy`: Strict frame-ancestors and script policies.

## Single-Use Authorization Code Patterns
- **Decision**: Use a `codes` table in SQLite with `used_at` and `expires_at` columns.
- **Rationale**: Atomically verifying and updating `used_at` via Drizzle transactions prevents replay attacks (FR-004, FR-014).
- **Alternatives Considered**: 
  - **Redis**: Rejected to avoid adding a new infrastructure dependency (Monorepo standard is SQLite).
  - **In-Memory Map**: Rejected because it doesn't survive restarts (violates SC-006).

## JWT Signing with Environment Variables
- **Decision**: Utilize `jose` with `importPKCS8` or `importJWK` to load keys from `PRIVATE_KEY` environment variables.
- **Rationale**: Conforms to Principle III (Security) and FR-013. Environment variables are the project's standard for secrets.
- **Library Best Practices**: Use `jose` for lightweight, dependency-free (Bun native compatible) JWT and JWKS generation.

## MyInfo Data Filtering
- **Decision**: Implement a scope-to-attribute mapping utility in the domain layer.
- **Rationale**: Ensures that UserInfo responses only contain permitted attributes based on the granted access token scopes (FR-007, FR-009).
- **Mock Data Assumption**: Per A-001, data is mock/local but filtering logic is production-grade.
