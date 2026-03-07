# Quickstart: FAPI 2.0 Database Schema and Core Utilities

This guide provides setup and verification instructions for the FAPI 2.0 core infrastructure layer.

## Prerequisites

- **Bun** installed (`bun --version`).
- **SQLite** available for the Drizzle migrations.
- **Environment variables**:
  - `SERVER_KEY_ENCRYPTION_SECRET`: A 32-byte hex-encoded secret for encrypting server keys.

## Development Setup

1.  **Configure environment**:
    ```bash
    cp .env.example .env
    # Add SERVER_KEY_ENCRYPTION_SECRET
    ```

2.  **Initialize Database**:
    ```bash
    bunx drizzle-kit push:sqlite
    ```

3.  **Run migrations**:
    ```bash
    # Ensure backend migrations are up to date
    bun run db:migrate
    ```

## Core Infrastructure Verification

To verify that the infrastructure is set up correctly, use the following test cases:

### 1. Database Schema
Verify that all five core tables are present and follow the defined data model.

```bash
# Verify SQLite schema using the sqlite3 CLI
sqlite3 backend.db ".schema"
```

### 2. Cryptographic Utilities
Run the unit tests specifically for the crypto adapter to ensure ES256 signing and DPoP validation are functional.

```bash
bun test apps/backend/tests/infra/adapters/crypto.test.ts
```

### 3. Session Binding
Verify that the `AuthDataService` can correctly bind a DPoP JKT to a session and retrieve it.

```bash
bun test apps/backend/tests/core/application/session.test.ts
```

## Troubleshooting

- **Migration Failure**: If Drizzle Kit fails to push, verify the SQLite connection string in `apps/backend/src/infra/database/client.ts`.
- **JWKS Error**: If the JWKS endpoint fails, verify that at least one `ServerKey` record exists in the database with `is_active = true`.
- **DPoP Rejected**: Ensure the client's `iat` is synchronized with the server's system time (within 60s window).
