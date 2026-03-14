# Quickstart: Auth Error Redirect Compliance

## Summary
Implements OIDC-compliant error redirects for terminal authentication failures (e.g., max password/OTP retries reached) while maintaining inline feedback for temporary errors.

## Local Development Setup

### 1. Database Migrations
Generate and apply migrations to add `retry_count` to the `auth_sessions` table:
```bash
cd apps/backend
bun run db:generate
bun run db:migrate
```

### 2. Run the Backend
```bash
bun run dev
```

### 3. Run the Frontend
```bash
cd ../frontend
bun run dev
```

## Testing the Flow

### 1. Initiate Auth
Use a tool like Postman or a script to perform a PAR request, then navigate to the returned URL (or use the existing UI flow).

### 2. Simulate Terminal Failure (Login)
1. On the login page, enter incorrect credentials 3 times.
2. Verify that on the 3rd attempt, the browser is redirected back to the `redirect_uri` with `error=login_required` and the correct `state`.
3. Verify the terminal failure is logged in the `security_audit_log` table.

### 3. Simulate Terminal Failure (2FA)
1. Login successfully with correct credentials.
2. On the 2FA page, enter incorrect OTP 3 times.
3. Verify the browser is redirected to the `redirect_uri` with `error=login_required`.
4. Verify the terminal failure is logged in the `security_audit_log` table.

## Acceptance Tests
- **Unit Tests**: `ValidateLogin.test.ts` and `Validate2FA.test.ts` should cover retry incrementing and terminal state transition.
- **Integration Tests**: `auth.controller.test.ts` should verify the 302 redirect response with correct parameters.
