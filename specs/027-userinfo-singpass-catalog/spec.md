# Feature Specification: Singpass Myinfo Userinfo Catalog Alignment

**Feature Branch**: `027-userinfo-singpass-catalog`  
**Created**: 2026-03-16  
**Status**: Draft  
**Input**: User description: "modify current userinfo (myinfo v5) mechanism to implement or follow userinfo/myinfo catalog that align with singpass specs"

## Clarifications
### Session 2026-03-16
- Q: Should the implementation include every single field from all 7 catalogs, or just a representative subset for mock testing purposes? → A: Full implementation.
- Q: How exactly should missing catalog fields be represented in the JSON payload to strictly align with Singpass specs? → A: Return explicit null values.
- Q: How should the mock user data be seeded and managed in the system? → A: Database seed script/ORM.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Retrieve Validated Userinfo Payload (Priority: P1)

As a relying party (API client), I want to request the userinfo endpoint and receive a payload that matches the official Singpass Myinfo v5 specifications so that I can validate the data properly according to the official guidelines.

**Why this priority**: Essential for integrating clients to successfully decode and validate the userinfo payload.

**Independent Test**: Can be tested independently by querying the userinfo endpoint with a valid access token and asserting that the structure, headers, and signature match the expected Singpass specs.

**Acceptance Scenarios**:

1. **Given** a valid access token, **When** the client calls the userinfo endpoint, **Then** the response is a properly signed/encrypted JWE/JWS payload following Singpass specifications.
2. **Given** an invalid token, **When** the client calls the userinfo endpoint, **Then** an appropriate standard error response is returned.

---

### User Story 2 - Provide Comprehensive Myinfo Data Catalog Fields (Priority: P1)

As a relying party, I want the userinfo response to support the full scope of Myinfo Data Catalogs (Personal, Finance, Education, Family, Vehicle, Property, Government Scheme) so that I can fetch the specific domain data requested by the application.

**Why this priority**: It is the core goal of the feature to align the returned data with the official Myinfo catalogs.

**Independent Test**: Can be tested independently by creating test users with specific catalog data and verifying that the API correctly maps and outputs these fields when the required scopes are requested.

**Acceptance Scenarios**:

1. **Given** a requested scope that includes personal and finance data, **When** the userinfo is retrieved, **Then** the payload includes the corresponding correctly structured fields.
2. **Given** a mock Singpass user, **When** they authenticate, **Then** they can log in using the default password "test1234".

### Edge Cases

- When a user does not have data for a specific catalog category (e.g., no property owned or no vehicle licence), the system MUST return explicit `null` values for those fields.
- How does the system handle requested scopes that refer to deprecated or restricted data fields?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST align the userinfo response format with the Myinfo v5 specification.
- **FR-002**: System MUST structure the userinfo payload to include **every single field** across all 7 categories defined in the Myinfo Data Catalog: Personal, Finance, Education and Employment, Family, Vehicle and Driving Licence, Property, and Government Scheme.
- **FR-003**: System MUST construct and validate the userinfo payload in adherence to the Singpass Authentication API "Validating the payload" specifications.
- **FR-004**: System MUST allow mock Singpass users to authenticate with a default password of "test1234".
- **FR-005**: System MUST return explicit `null` values for catalog fields where the user lacks data.
- **FR-006**: System MUST seed and manage mock user data into the database using a script or ORM.

### Key Entities

- **Singpass User**: Represents an individual whose data is managed and returned by the userinfo endpoint.
- **Userinfo Payload**: The assembled, formatted, and secured JSON object containing the user's catalog data.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of generated userinfo payloads pass verification against the official Singpass validation tools/scripts.
- **SC-002**: All 7 mentioned Myinfo data catalog domains are represented and fetchable based on valid mock user data.
- **SC-003**: Authentication for all test users succeeds in under 1 second using the "test1234" default password.
