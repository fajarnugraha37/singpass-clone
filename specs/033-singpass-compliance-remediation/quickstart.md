# Quickstart: Singpass Compliance Remediation

## Verification Steps

### 1. Update Seed Data
To verify the MyInfo metadata fixes, the mock data must be re-seeded using the updated seed script.

```bash
bun run apps/backend/src/infra/database/seed-myinfo.ts
```

### 2. Run Compliance Tests
New tests are being added to verify the `DPoP-Nonce` flow and metadata presence.

```bash
bun test apps/backend/tests/compliance/dpop-nonce.test.ts
bun test apps/backend/tests/unit/application/mappers/myinfo-mapper.test.ts
```

### 3. Verify Privacy (NRIC vs UUID)
Run the userinfo test to confirm the `sub` claim is a UUID and not an NRIC.

```bash
bun test apps/backend/tests/unit/core/use-cases/get-userinfo.test.ts
```

## Local Setup

1.  Ensure you have a local `vibe-auth` database:
    `bun run apps/backend/check_tables.ts`
2.  Start the backend:
    `cd apps/backend && bun src/index.ts`
3.  Start the frontend:
    `cd apps/frontend && bun run dev`
