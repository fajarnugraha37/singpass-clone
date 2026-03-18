# Quickstart: PAR authentication_context_type Validation

## Implementation Checklist

1. [ ] Update `parRequestSchema` in `packages/shared/src/config.ts`.
2. [ ] Define `AuthenticationContextType` enum and constants in `packages/shared/src/config.ts`.
3. [ ] Update `ClientConfig` interface in `apps/backend/src/core/domain/client_registry.ts`.
4. [ ] Implement validation logic in `RegisterParUseCase` (`apps/backend/src/core/use-cases/register-par.ts`).
5. [ ] Update `MOCK_CLIENT_REGISTRY` in `apps/backend/src/infra/adapters/client_registry.ts` with different `appType` values for testing.

## Testing Instructions

### 1. Unit Tests for RegisterParUseCase

Create a new test file: `apps/backend/tests/unit/use-cases/register-par-context.test.ts`.

Test Scenarios:

- **Login App Success**: Valid `authentication_context_type` and optional `authentication_context_message`.
- **Login App Failure**: Missing `authentication_context_type`.
- **Login App Failure**: Invalid `authentication_context_type` enum value.
- **Login App Failure**: Invalid `authentication_context_message` (length/chars).
- **Myinfo App Success**: Missing `authentication_context_type` (correct for Myinfo).
- **Myinfo App Failure**: Providing `authentication_context_type` or `authentication_context_message`.

### 2. Manual Test with `curl`

Assuming the backend is running on `localhost:3000`:

**Login App - Success**

```bash
# Note: You'll need to generate a valid client_assertion (JWT)
curl -X POST https://localhost/api/par \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "response_type=code" \
  -d "client_id=mock-client-id" \
  -d "scope=openid" \
  -d "state=test-state" \
  -d "nonce=test-nonce" \
  -d "redirect_uri=https://localhost/callback" \
  -d "code_challenge=challenge" \
  -d "code_challenge_method=S256" \
  -d "client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer" \
  -d "client_assertion=[JWT_HERE]" \
  -d "authentication_context_type=APP_AUTHENTICATION_DEFAULT" \
  -d "authentication_context_message=Authorize login"
```

**Login App - Failure (Missing context)**

```bash
curl -X POST https://localhost/api/par \
  -d "client_id=mock-client-id" \
  ... (rest of fields)
  # No authentication_context_type
```

Expect: `{"error": "invalid_request", "error_description": "authentication_context_type is mandatory for Login apps"}`.

### 3. Verify Persistence

Check the `par_requests` table in the SQLite database to ensure the `payload` JSON contains the new fields.

```bash
sqlite3 apps/backend/dev.db "SELECT payload FROM par_requests ORDER BY created_at DESC LIMIT 1;"
```
