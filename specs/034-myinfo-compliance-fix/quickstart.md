# Quickstart: Singpass MyInfo Compliance Remediations

## Summary
This feature remediates all findings from the MyInfo v5 compliance audit, ensuring that the mock server returns data that is structurally and semantically identical to the official Singpass MyInfo API.

## Core Changes

1.  **Shared Types**: Update `packages/shared/src/types/myinfo-catalog.ts` to include mandatory metadata, new NOA fields, and corrected `regadd`/`vehicles` structures.
2.  **Domain Entity**: Refactor `apps/backend/src/core/domain/myinfo-person.ts` to align with the new types and initialize default metadata.
3.  **Database Seeder**: Update `apps/backend/src/infra/database/seed-myinfo.ts` to populate the new fields and metadata.
4.  **Data Mapper**: Update `apps/backend/src/application/mappers/myinfo-mapper.ts` to correctly handle nested `regadd`, `vehicles` array, and sorted lists.
5.  **Scope Mapper**: Extend `apps/backend/src/core/myinfo/scope_mapper.ts` to support granular financial scopes.

## Verification Steps

### 1. Run Unit Tests
Verify the domain logic and mapper transformations.
```bash
bun test apps/backend/tests/unit/application/mappers/myinfo-mapper.test.ts
```

### 2. Verify Schema Compliance
Generate a UserInfo payload and validate against a compliant parser (or verify metadata presence).
```bash
# Check for metadata in the output of the UserInfo use case
# (Specific command depends on test setup)
```

### 3. Check Seeding
Re-seed the database and verify the SQLite contents.
```bash
cd apps/backend
bun run seed
# Use sqlite3 to check myinfo_person records
```

## Key Files to Watch
- `packages/shared/src/types/myinfo-catalog.ts` (Source of truth for types)
- `apps/backend/src/application/mappers/myinfo-mapper.ts` (Flattening logic)
- `apps/backend/src/infra/database/seed-myinfo.ts` (Mock data generation)
