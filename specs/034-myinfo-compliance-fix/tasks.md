# Tasks: Singpass MyInfo Compliance Fixes

**Feature**: 034-myinfo-compliance-fix
**Plan**: [specs/034-myinfo-compliance-fix/plan.md]

## Implementation Strategy
We will follow an incremental delivery approach, starting with the foundational type changes and the high-priority metadata (US1) and structural fixes (US2). Financial data enhancements (US3) and catalog expansions (US4) will follow. Each user story phase results in a testable increment.

## Phase 1: Setup
- [x] T001 Initialize branch and environment check for feature 034-myinfo-compliance-fix

## Phase 2: Foundational (Blocking Prerequisites)
- [x] T002 Update `MyinfoValue` interface to make `source`, `classification`, and `lastupdated` mandatory in `packages/shared/src/types/myinfo-catalog.ts`
- [x] T003 Update `MyinfoAddress` interface with direct `type` string and `country` object in `packages/shared/src/types/myinfo-catalog.ts`
- [x] T004 Add `MyinfoNoaDetailed` and update `MyinfoFinance` in `packages/shared/src/types/myinfo-catalog.ts`
- [x] T005 Rename `MyinfoVehicle` to `MyinfoVehicleRecord` and update `MyinfoCatalog` to use `vehicles` array in `packages/shared/src/types/myinfo-catalog.ts`
- [x] T006 Update `createEmptyMyinfoPerson` to initialize mandatory metadata in `apps/backend/src/core/domain/myinfo-person.ts`

## Phase 3: [US1] Compliant Data Metadata (Priority: P1)
**Goal**: Every returned field must contain mandatory metadata (source, classification, lastupdated).
**Independent Test**: Verify UserInfo response includes metadata for all fields.

- [x] T007 [P] [US1] Update `seed-myinfo.ts` to provide default metadata for all personal fields in `apps/backend/src/infra/database/seed-myinfo.ts`
- [x] T008 [US1] Update `mapMyinfoProfile` to pass through metadata fields for all attributes in `apps/backend/src/application/mappers/myinfo-mapper.ts`
- [x] T009 [US1] Create unit test to verify metadata presence in UserInfo response in `apps/backend/tests/unit/application/mappers/myinfo-mapper.test.ts`

## Phase 4: [US2] Correct Address and Vehicle Structures (Priority: P1)
**Goal**: `regadd` and `vehicles` follow official v5 nesting and array patterns.
**Independent Test**: Verify `regadd.type` is string and `vehicles` is an array of objects.

- [x] T010 [US2] Update `seed-myinfo.ts` to seed `regadd` with new structure and `vehicles` array in `apps/backend/src/infra/database/seed-myinfo.ts`
- [x] T011 [US2] Update `mapMyinfoProfile` to handle non-wrapped `regadd.type` and `vehicles` array in `apps/backend/src/application/mappers/myinfo-mapper.ts`
- [x] T012 [US2] Verify `regadd` and `vehicles` structure in `apps/backend/tests/unit/application/mappers/myinfo-mapper.test.ts`

## Phase 5: [US3] Detailed Financial Data Support (Priority: P2)
**Goal**: Support detailed NOA, sorted CPF contributions, and granular sub-scopes.
**Independent Test**: Verify `noa` breakdown, sorted `cpfcontributions`, and granular account requests.

- [x] T013 [US3] Add `month` field to `MyinfoCpfContribution` and update seeder in `apps/backend/src/infra/database/seed-myinfo.ts`
- [x] T014 [US3] Implement ascending chronological sorting for `cpfcontributions` in `apps/backend/src/infra/database/seed-myinfo.ts`
- [x] T015 [US3] Update `SCOPE_TO_ATTRIBUTES` to support granular finance sub-scopes in `apps/backend/src/core/myinfo/scope_mapper.ts`
- [x] T016 [US3] Update `filterPersonByScopes` to handle dot-notation financial attributes in `apps/backend/src/core/myinfo/scope_mapper.ts`
- [x] T017 [US3] Add `noa` and `noahistory` seeding with detailed breakdown in `apps/backend/src/infra/database/seed-myinfo.ts`

## Phase 6: [US4] Expanded Catalog Support (Priority: P3)
**Goal**: Add academic qualifications and structured HDB ownership.
**Independent Test**: Verify `academicqualifications` and `hdbownership` structure in response.

- [x] T018 [US4] Add `academicqualifications` and `ltavocationallicences` to education catalog in `packages/shared/src/types/myinfo-catalog.ts`
- [x] T019 [US4] Update seeder to include education qualifications and structured HDB ownership in `apps/backend/src/infra/database/seed-myinfo.ts`

## Phase 7: Polish & Cross-Cutting Concerns
- [x] T020 Run full backend test suite to ensure no regressions in OIDC/MyInfo flows
- [x] T021 [P] Verify `person_info` payload against `contracts/userinfo-response.md`

## Dependencies
- US1 & US2 depend on Foundational (Phase 2).
- US3 depends on US1 (for metadata consistency).
- US4 depends on Foundational (Phase 2).

## Parallel Execution Examples
- [US1] Seeder update (T007) and Mapper verification (T009)
- [US4] Type definition (T018) can happen in parallel with US1/US2/US3 if needed.
- Polish verification (T021) can be done independently once US1/US2/US3 are merged.
