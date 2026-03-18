# Quickstart: Singpass Compliance Remediation

## Prerequisites

- Bun 1.1+
- Existing `vibe-auth` backend and shared package.

## Setup

1. **Update Domain Model**: Apply changes to `apps/backend/src/core/domain/client_registry.ts`.
2. **Implement Validation**: Add `validateUrlSafe` and `validateScopes` to `apps/backend/src/core/auth/validation.ts`.
3. **Update Registry**: Update `apps/backend/src/infra/adapters/client_registry.ts` with the new metadata fields.
4. **Integrate into PAR**: Update `apps/backend/src/core/use-cases/register-par.ts` to use the new validations and check activation status.

## Verification

### Automated Compliance Tests

Run the new compliance test suite to verify all remediation logic:

```bash
cd apps/backend
bun test tests/compliance/singpass_compliance.test.ts
```

### Manual Verification (PAR)

Use `curl` or a REST client to attempt a PAR registration with:
- An IP address in the `redirect_uri`.
- A scope that is not authorized for the client.
- A client ID that is deactivated (`isActive: false`).

All these should return appropriate OIDC error responses (`invalid_request`, `invalid_scope`, `unauthorized_client`).
