# Feature Specification: Singpass MyInfo Compliance Remediation

**Feature Branch**: `034-myinfo-compliance-fix`  
**Created**: 2026-03-18  
**Status**: Draft  
**Input**: User description: "Please remediate following findings from Singpass MyInfo Data Catalog compliance audit report"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Compliant Data Metadata (Priority: P1)

As a Relying Party (RP), I want to receive MyInfo data fields that include mandatory metadata (source, classification, lastupdated) so that I can verify the authenticity and currency of the data.

**Why this priority**: High. Without metadata, RPs cannot perform necessary audit and verification checks, and standard MyInfo libraries will fail to parse the response.

**Independent Test**: Can be tested by requesting any MyInfo person data and verifying that every field (e.g., `uinfin`, `name`) is wrapped in an object containing `value`, `source`, `classification`, and `lastupdated`.

**Acceptance Scenarios**:

1. **Given** a user with verified MyInfo data, **When** an RP requests the user's information, **Then** every returned field MUST contain the standard metadata structure.
2. **Given** a mock user, **When** data is seeded, **Then** the system MUST provide default metadata values (e.g., 'S' for source) if not explicitly provided.

---

### User Story 2 - Correct Address and Vehicle Structures (Priority: P1)

As a developer of a Relying Party application, I want the Registered Address and Vehicle data to follow the official MyInfo v5 nesting and array patterns so that my application can parse the data correctly using standard integrations.

**Why this priority**: High. Structural mismatches in `regadd` and `vehicles` cause immediate integration failures and protocol violations.

**Independent Test**: Request `regadd` and `vehicles` scopes and verify `regadd.type` is a string, `regadd.country` is an object, and `vehicles` is an array of objects.

**Acceptance Scenarios**:

1. **Given** a user with an address, **When** the `regadd` field is returned, **Then** the `type` discriminator MUST be a direct string (not wrapped) and `country` MUST be an object with `code` and `desc`.
2. **Given** a user with multiple vehicles, **When** the information is requested, **Then** the system MUST return a `vehicles` array containing multiple objects instead of flattened top-level fields.

---

### User Story 3 - Detailed Financial Data Support (Priority: P2)

As a financial service provider, I want to access the detailed Notice of Assessment (NOA) and sorted CPF contributions so that I can perform accurate credit assessments.

**Why this priority**: Medium. Detailed NOA is critical for high-value financial applications (e.g., mortgages, loans).

**Independent Test**: Request `noa` and `cpfcontributions` scopes and verify the presence of income breakdowns and chronological sorting.

**Acceptance Scenarios**:

1. **Given** a request for `noa` (Detailed), **When** the response is generated, **Then** it MUST include structured breakdowns for employment, trade, interest, and rent income.
2. **Given** multiple CPF contribution entries, **When** the history is returned, **Then** entries MUST be sorted by "Paid on" date and then "For Month" in ascending order.

---

### User Story 4 - Expanded Catalog Support (Priority: P3)

As an employer or education provider, I want to access academic qualifications and vocational licenses from the MyInfo mock to verify a user's credentials.

**Why this priority**: Low. Expands the utility of the mock server to more industry sectors.

**Independent Test**: Request `academicqualifications` scope and verify the presence of the education sub-catalog.

**Acceptance Scenarios**:

1. **Given** a user with educational history, **When** requested, **Then** the `education` sub-catalog MUST include `academicqualifications` and `ltavocationallicences`.

---

### Edge Cases

- **Missing Metadata in Seed**: System must fallback to reasonable defaults (e.g., Source: 'S', Classification: 'C') if seed data only provides `value`.
- **Tax Clearance**: If a user has tax clearance, the NOA `type` field must be dynamically updated to include "(Clearance)".
- **Granular Scopes**: Requesting a specific account (e.g., `cpfbalances.oa`) must return only that account, not the entire balance object.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST wrap every MyInfo data field in an object containing `value`, `source`, `classification`, and `lastupdated`.
- **FR-002**: System MUST return `regadd` with `type` as a direct string and `country` as an object `{ code, desc }`.
- **FR-003**: System MUST provide a `vehicles` array for vehicle data, even for single-vehicle owners.
- **FR-004**: System MUST support detailed income breakdown fields in `noa` and `noahistory`.
- **FR-005**: System MUST sort `cpfcontributions` entries chronologically (Paid on -> For Month) in ascending order.
- **FR-006**: System MUST include `academicqualifications` and `ltavocationallicences` in the education catalog.
- **FR-007**: System MUST support the `type` field for NOA and append " (Clearance)" based on tax clearance status.
- **FR-008**: System MUST support structured objects within the `hdbownership` array.
- **FR-009**: Scope mapper MUST support specific sub-scopes for granular finance accounts (e.g., `cpfbalances.ma`).
- **FR-010**: System MUST provide the `month` field (YYYY-MM) for each CPF contribution record.

### Key Entities *(include if feature involves data)*

- **MyinfoPerson**: The core domain entity representing a user's government-verified identity.
- **MyinfoField**: A generic wrapper entity for all data points, ensuring consistent metadata across the catalog.
- **MyinfoFieldMetadata**: Metadata associated with each field, including source (verified/unverified), classification (confidentiality level), and last update timestamp.
- **MyinfoFinance**: Sub-catalog containing tax (NOA) and CPF data with specific sorting and status requirements.

## Assumptions

- **Data Origin**: All data returned in the MyInfo mock is assumed to be "Government Verified" (Source: 'S') unless specified otherwise in the seed data.
- **Data Sensitivity**: Default classification for most personal data fields is 'C' (Confidential).
- **Timezone**: All `lastupdated` timestamps are assumed to be in UTC or SGT as per standard system configuration.
- **Protocol Version**: This remediation targets Singpass MyInfo API v5 compatibility.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of MyInfo response payloads pass validation against the official Singpass MyInfo v5 JSON schemas.
- **SC-002**: Standard MyInfo client libraries (e.g., `jose`, `passport-singpass`) can successfully parse the `regadd` and `vehicles` structures without custom workarounds.
- **SC-003**: All CPF contribution arrays returned by the API are pre-sorted chronologically 100% of the time.
- **SC-004**: RPs can request and receive granular sub-scopes for financial accounts with 100% accuracy in data isolation.
