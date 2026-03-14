# Quickstart: PAR `redirect_uri` Registration Validation

## Setup

1. Check out the feature branch:
   ```bash
   git checkout 013-par-redirect-validation
   ```

2. Verify the mock registry in `apps/backend/src/infra/adapters/client_registry.ts` contains your test client with registered `redirectUris`.

## Testing the Validation

### Test Case 1: Valid Redirect URI
Submit a PAR registration with a `redirect_uri` that exactly matches one in the client's registry.

**Response**: `201 Created` with a `request_uri`.

### Test Case 2: Unregistered Redirect URI
Submit a PAR registration with a `redirect_uri` that is NOT in the client's registry (e.g., `https://attacker.com/callback`).

**Response**: `400 Bad Request` with `error: "invalid_request"`.

### Test Case 3: Case Mismatch
Submit a PAR registration with a `redirect_uri` that differs only in case from the registered URI (e.g., `https://example.com/CALLBACK` vs `https://example.com/callback`).

**Response**: `400 Bad Request` with `error: "invalid_request"`.

### Test Case 4: Missing Redirect URI
Submit a PAR registration without the `redirect_uri` parameter.

**Response**: `400 Bad Request` with `error: "invalid_request"`.
