# Research: Mock Client Registry — Add Encryption Key

## Decision
Update `MOCK_CLIENT_REGISTRY` in `apps/backend/src/infra/adapters/client_registry.ts` to include an `enc` key for `mock-client-id`.

## Rationale
The `TokenService` in `apps/backend/src/core/application/services/token.service.ts` explicitly checks for an `enc` key in the client configuration to generate a nested JWE ID Token. The lack of this key for `mock-client-id` causes ID Token generation to fail with "Client public encryption key not found".

## Findings
- **Client Registry Location**: `apps/backend/src/infra/adapters/client_registry.ts`
- **Key Requirement**: Algorithm `ECDH-ES+A256KW`, use `enc`, type `EC` (P-256).
- **Current Mock Config**: `mock-client-id` only has a `sig` key.

## Key Generation
A new EC P-256 public key has been generated for mock use:
```json
{
  "kty": "EC",
  "crv": "P-256",
  "x": "1HrSJLEHsUI8f3TCMdiFVtDyXOtmJeu0x2b0MT-a1vI",
  "y": "cRC2KiCF4oQxfiZ39vVBMp5ng2rPEpYSSmNI7brbTiQ",
  "kid": "mock-client-enc-key",
  "use": "enc",
  "alg": "ECDH-ES+A256KW"
}
```

## Alternatives Considered
- **Dynamic Key Generation**: Rejected because static mock data is more predictable for unit and integration testing.
- **Using same key for sig and enc**: Rejected as it's a security anti-pattern, even for mock clients, and doesn't align with Singpass/FAPI best practices.
