# Feature Specification: Unify Client Registry Access

**Feature Branch**: `022-unify-client-registry-access`
**Created**: 2026-03-15
**Status**: Draft
**Input**: User description: "Client Registry Access Pattern Consistency **Finding**: #11 (e Low) ### Problem Two access patterns exist: `DrizzleClientRegistry` class (async, port-based) and `getClientConfig()` function (sync, direct). Some code bypasses the hexagonal architecture. ### Acceptance Criteria 1. All client config access MUST go through the `ClientRegistry` port interface. 2. The bare `getClientConfig()` function MUST be removed. 3. `JoseCryptoService.validateRedirectUri()` MUST use the injected `ClientRegistry`."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consistent Client Configuration Access (Priority: P1)

As a developer, I want all client configuration to be accessed through a single, consistent interface (`ClientRegistry` port) so that the codebase is easier to understand, maintain, and adheres to the hexagonal architecture principles.

**Why this priority**: This refactoring is critical for maintaining architectural integrity, reducing technical debt, and improving the overall developer experience. It ensures that the system remains scalable and easy to reason about.

**Independent Test**: A combination of static analysis and code review can verify that all access to client configuration data is channeled through the `ClientRegistry` port. A global search for the `getClientConfig()` function should yield no results.

**Acceptance Scenarios**:

1.  **Given** any service or component that requires client configuration, **When** it retrieves this data, **Then** it MUST do so by invoking a method on an injected `ClientRegistry` port implementation.
2.  **Given** the entire codebase, **When** a search is performed for `getClientConfig()`, **Then** no usages of this function MUST be found, and the function definition itself MUST be deleted.
3.  **Given** the `JoseCryptoService`, **When** its `validateRedirectUri` method is executed, **Then** it MUST use the injected `ClientRegistry` instance to fetch the necessary client configuration for validation.

### Edge Cases

- What happens if a client configuration is not found for a given client ID? The `ClientRegistry` should handle this gracefully, likely by returning `null` or `undefined`, or throwing a specific `ClientNotFoundError`.
- How does the system behave if the underlying data source for the client registry is unavailable? The port implementation should manage this, potentially through retries or by throwing an appropriate exception.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST define a `ClientRegistry` port interface that declares the contract for retrieving client configuration.
- **FR-002**: All system components that need client configuration data MUST depend on the `ClientRegistry` port interface, not on any concrete implementation.
- **FR-003**: The standalone `getClientConfig()` function MUST be completely removed from the codebase.
- **FR-004**: The `JoseCryptoService` MUST be refactored to accept an instance of the `ClientRegistry` via dependency injection and use it for its validation logic.
- **FR-005**: The `DrizzleClientRegistry` adapter MUST fully and correctly implement the `ClientRegistry` port interface.
- **FR-006**: The dependency injection container MUST be configured to provide the `DrizzleClientRegistry` adapter wherever the `ClientRegistry` port is required.

### Key Entities *(include if feature involves data)*

- **ClientRegistry (Port)**: An interface defining the contract for retrieving client configuration details (e.g., `getClientById(clientId)`). It acts as the gateway for client data within the application core.
- **DrizzleClientRegistry (Adapter)**: The concrete implementation of the `ClientRegistry` port. It is responsible for fetching client configuration from a database using the Drizzle ORM.
- **JoseCryptoService (Core Service)**: A service within the application's core logic that performs cryptographic operations (like token validation) and requires client configuration to validate parameters such as redirect URIs.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of all client configuration access throughout the codebase is performed exclusively through the `ClientRegistry` port interface. This can be verified by static analysis and code review.
- **SC-002**: The `getClientConfig()` function is completely eliminated from the codebase. This is verifiable by a global search returning zero results for the function name.
- **SC-003**: All existing automated tests (unit, integration, and end-to-end) MUST continue to pass after the refactoring is complete, ensuring no regressions have been introduced.
- **SC-004**: Code coverage for the refactored components (`JoseCryptoService`, `DrizzleClientRegistry`) and any newly introduced code remains at or above the project's required threshold of 80%.
- **SC-005**: A static analysis scan or architectural review confirms that no code outside of the `DrizzleClientRegistry` adapter directly accesses the client configuration data store, thus enforcing the hexagonal architecture boundary.
