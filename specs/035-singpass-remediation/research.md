# Research: Singpass Compliance Remediation

## Decision: URL and IP Validation

- **Decision**: Implement a strict URL validation utility in `apps/backend/src/core/auth/validation.ts`.
- **Rationale**: Singpass strictly prohibits IP addresses in redirect and site URLs for security reasons. HTTPS enforcement is also a mandatory requirement for production-like environments.
- **Alternatives considered**: Using `z.string().url()` with refinements in the shared schema. While good for transport, domain-level validation in the Use Case provides defense-in-depth and better error reporting.
- **Implementation Detail**:
  - Hostname check: Reject if the hostname is an IP address (IPv4 or IPv6).
  - Protocol check: Reject if not `https://`, unless `NODE_ENV !== 'production'` and hostname is `localhost` or `127.0.0.1`.

## Decision: Scope Authorization Enforcement

- **Decision**: Add `allowedScopes: string[]` to `ClientConfig` and validate in `RegisterParUseCase`.
- **Rationale**: Prevents scope escalation where a client requests more data than approved by the Singpass Admin.
- **Alternatives considered**: Storing authorized scopes in a separate table.
- **Decision**: Keep it in the `ClientConfig` for now for simplicity, as it's a direct attribute of the client registration.
- **Validation logic**: `requestedScopes.every(scope => allowedScopes.includes(scope))`.

## Decision: Client Activation Status

- **Decision**: Add `isActive: boolean` to `ClientConfig`.
- **Rationale**: Simplest way to handle activation/deactivation as required by Singpass user guides.
- **Enforcement points**:
  - `RegisterParUseCase` (Initial entry)
  - `Authorization` flow (Redirect entry)
  - `Token` endpoint (Exchange entry)

## Decision: UEN and Administrative Metadata

- **Decision**: Extend `ClientConfig` with `uen`, `appDescription`, `siteUrl`, `supportEmails`, and `hasAcceptedAgreement`.
- **Rationale**: Fully mirrors the Singpass Developer Portal's data model, enabling future features like entity-wide quotas and administrative reviews.
- **Storage**: Add a `clients` table to the SQLite schema to support persistent storage of these new fields, moving away from a purely hardcoded registry for some attributes.

## Decision: Environment Context

- **Decision**: Use `process.env.NODE_ENV` to determine if strict production rules (HTTPS enforcement, no localhost) apply.
- **Rationale**: Consistent with existing patterns in the codebase (`ValidateLogin.ts`, `rate-limiter.ts`).
