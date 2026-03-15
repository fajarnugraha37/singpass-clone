# Quickstart: Singpass Implementation Hardening

## Overview
This feature provides an automated CLI tool to scan and harden the Singpass clone implementation.

## Prerequisites
- **Environment Variables**:
  - `OIDC_PRIVATE_KEY`: RSA/EC private key for token signing.
  - `OIDC_ISSUER`: Public URL of the IDP.
- **Database**: Ensure SQLite migrations for `auth_codes` and `auth_sessions` are applied.

## Running the Hardening Scan
Execute the automated tool from the root of the monorepo:

```bash
bun run harden:scan
```

### What it does:
1. **Scans** for `TODO`, `MOCK`, `FIXME`, `devMode`, `bypassAuth` across `apps/`.
2. **Replaces** mock logic with calls to the hardened domain layer.
3. **Applies** FAPI 2.0 security headers via Hono middleware.
4. **Validates** results by running the compliance test suite.

## Verification
After running the scan, verify compliance using:

```bash
bun test apps/backend/tests/compliance
```

This ensures all security invariants (PKCE, code single-use, nonce validation) are passing.
