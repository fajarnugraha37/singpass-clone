# Data Model: Unify Client Registry Access

**Date**: 2026-03-15

This feature is a refactoring effort and does not introduce or alter the underlying data model for client configurations. The primary change is to the **data access pattern**.

## 1. Key Entities (Access Pattern)

The data model for `ClientConfig` remains unchanged. The focus of this feature is on the entities that govern access to that data, enforcing the Hexagonal Architecture.

### `ClientRegistry` (Port)

-   **Type**: Interface / Port
-   **Purpose**: Defines the sole, authoritative contract for accessing client configuration data from within the application's core domain.
-   **Methods**:
    -   `getClientConfig(clientId: string): Promise<ClientConfig | null>`
-   **Rationale**: By depending on this interface, the core application logic is completely decoupled from the data source implementation (e.g., database, in-memory store).

### `DrizzleClientRegistry` (Adapter)

-   **Type**: Class / Adapter
-   **Purpose**: Implements the `ClientRegistry` port. It acts as the bridge between the application's core and the persistence layer.
-   **Responsibilities**:
    -   Contains the logic for querying the SQLite database using Drizzle ORM to fetch client configuration.
    -   Handles the connection to the database.
    -   Translates the database result into the `ClientConfig` domain object.

### `JoseCryptoService` and other services

-   **Type**: Core Service
-   **Change**: These services will no longer have direct or indirect knowledge of how client configuration is stored or retrieved.
-   **New Dependency**: They will depend solely on the `ClientRegistry` port, which will be provided via dependency injection.

## 2. Data Flow

The intended data flow for retrieving client configuration is as follows:

1.  A **Core Service** (e.g., `JoseCryptoService`) requires configuration for a specific client.
2.  The service calls `this.clientRegistry.getClientConfig(clientId)`.
3.  The dependency injection container provides the concrete `DrizzleClientRegistry` adapter as the implementation for `clientRegistry`.
4.  The `DrizzleClientRegistry` adapter queries the database for the client's data.
5.  The adapter returns the `ClientConfig` object (or `null`) to the core service.

This flow ensures that the core domain remains pure and testable, with all external data access handled by adapters at the edge of the system.
