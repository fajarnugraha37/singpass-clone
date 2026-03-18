# Research: Singpass MyInfo Compliance Fixes

## Decision: Mandatory Metadata and Structural Alignment

To remediate the compliance audit findings, we will update the core MyInfo domain entities, shared types, and data mappers to align strictly with the Singpass MyInfo v5 specification.

### 1. Mandatory Metadata
- **Decision**: Update `MyinfoValue<T>` to make `source`, `classification`, and `lastupdated` mandatory properties.
- **Rationale**: The audit report and `docs/singpass-server/05-userinfo-endpoint.md` state these are mandatory for every field in the `person_info` object.
- **Default Values**:
  - `source`: "1" (Government-verified)
  - `classification`: "C" (Confidential)
  - `lastupdated`: Current date in `YYYY-MM-DD` format (or seeded date).

### 2. Registered Address (`regadd`) Structure
- **Decision**: Refactor `MyinfoAddress` interface.
- **Rationale**: The audit found that `type` must be a direct string (e.g., "SG") and `country` must be an object with `code` and `desc`.
- **Implementation**:
  ```typescript
  export interface MyinfoAddress {
    type: string; // Direct string, not MyinfoValue
    block: MyinfoValue<string>;
    building: MyinfoValue<string>;
    floor: MyinfoValue<string>;
    unit: MyinfoValue<string>;
    street: MyinfoValue<string>;
    postal: MyinfoValue<string>;
    country: {
      code: string;
      desc: string;
    };
  }
  ```

### 3. Vehicle Data (`vehicles`)
- **Decision**: Rename `vehicle` to `vehicles` and change to `Array<MyinfoVehicleRecord>`.
- **Rationale**: Singpass MyInfo returns an array to support multiple vehicle ownership.
- **Implementation**:
  ```typescript
  export interface MyinfoVehicleRecord {
    vehicleno: MyinfoValue<string>;
    type: MyinfoValue<string>;
    make: MyinfoValue<string>;
    model: MyinfoValue<string>;
    // ... other fields
  }
  ```

### 4. Financial Data (NOA & CPF)
- **Decision**: 
  - Add `noa` and `noahistory` with detailed income breakdowns.
  - Add `month` field to `MyinfoCpfContribution`.
  - Implement ascending chronological sorting for `cpfcontributions`.
- **Rationale**: Required for high-value financial applications and UI display consistency.

### 5. Education & Property Catalog
- **Decision**:
  - Add `academicqualifications` and `ltavocationallicences` to `MyinfoEducation`.
  - Implement structured `MyinfoHdbOwnership` array.
- **Rationale**: Completes the mandatory catalog support identified in the audit.

## Alternatives Considered

### Global vs Surgical Metadata
- **Alternative**: Keep metadata optional and only fill it in the mapper.
- **Rejected**: Making it mandatory in the domain ensures that seeding and all logic paths account for metadata, reducing the risk of "missing field" regressions in the future.

### Sorting in Mapper vs Use Case
- **Alternative**: Sort in the `MyinfoMapper`.
- **Rejected**: Sorting is better handled in the domain or use case layer (or the database seeder for mock data) to ensure the domain entity is always in a valid, consistent state before reaching the mapper.

## Reference
- `docs/singpass-server/05-userinfo-endpoint.md`
- `docs/singpass/data-catalog-myinfo/catalog/finance.md`
- `docs/singpass/data-catalog-myinfo/catalog/vehicle-and-driving-licence.md`
