# Research: PAR `redirect_uri` Registration Validation

## Decision: Implementation Location
The validation will be implemented within the `RegisterParUseCase.execute` method in `apps/backend/src/core/use-cases/register-par.ts`.

### Rationale
- The Use Case already retrieves the `ClientConfig` from the `ClientRegistry`.
- Domain validation (matching against registered URIs) belongs in the core logic, not just the transport layer (Hono/Zod).
- Centralizing this check ensures it applies regardless of which adapter (HTTP, CLI, etc.) triggers the use case.

## Decision: Validation Strictness
- **Matching Rule**: Exact string comparison (case-sensitive).
- **Mandatory Status**: `redirect_uri` MUST be present in the PAR request.
- **Error Code**: `invalid_request` (as per OAuth 2.0 / PAR specs).

### Rationale
- Security: Exact matching prevents various bypass techniques (e.g., directory traversal in URIs).
- Compliance: FAPI 2.0 and Singpass documentation imply a strict match.
- Predictability: Mandatory `redirect_uri` in PAR registration reduces ambiguity when multiple URIs are registered.

## Alternatives Considered

### Alternative 1: Validate in Zod schema
- **Pros**: Rejects invalid requests early at the edge.
- **Cons**: Zod doesn't have access to the `ClientRegistry` (database/mock) without complex dependency injection into the shared package, which violates layering.
- **Verdict**: Rejected. Layering is more important.

### Alternative 2: Case-insensitive matching
- **Pros**: More user-friendly.
- **Cons**: Can lead to security vulnerabilities depending on how the client handles redirects (e.g., if it uses the URI to look up a configuration).
- **Verdict**: Rejected. Security first.
