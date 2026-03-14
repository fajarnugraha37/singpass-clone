# Research: Unify Client Registry Access

**Date**: 2026-03-15
**Author**: Gemini

## 1. Summary of Findings

The goal is to refactor the codebase to use a consistent, port-based pattern for accessing client configuration, eliminating the direct-access `getClientConfig()` function.

The research confirms the following:

-   A synchronous, non-DI (Dependency Injection) function `getClientConfig()` exists at `apps/backend/src/infra/adapters/client_registry.ts`.
-   This function is being called directly from several places, bypassing the hexagonal architecture's port-and-adapter pattern.
-   A `ClientRegistry` port and a `DrizzleClientRegistry` adapter already exist and are used correctly in some parts of the application, demonstrating the established pattern.
-   The primary task is to refactor the non-compliant parts of the code to use the existing `ClientRegistry` port.

## 2. File Analysis

### `getClientConfig` Definition

-   **File**: `apps/backend/src/infra/adapters/client_registry.ts`
-   **Content**: `export function getClientConfig(clientId: string): ClientConfig | null { ... }`
-   **Issue**: This is a globally exported function that directly accesses data, breaking architectural boundaries. It needs to be deleted.

### Incorrect Usages to Refactor

The following files import and use the rogue `getClientConfig` function and must be refactored:

1.  **`apps/backend/src/infra/adapters/jose_crypto.ts`**:
    -   **Method**: `validateRedirectUri`
    -   **Code**: `const client = getClientConfig(clientId);`
    -   **Required Change**: Inject `ClientRegistry` into `JoseCryptoService`'s constructor and change the call to `await this.clientRegistry.getClientConfig(clientId)`.

2.  **`apps/backend/src/core/application/services/token.service.ts`**:
    -   **Issue**: Directly imports and calls `getClientConfig`.
    -   **Required Change**: Refactor `TokenService` to accept `ClientRegistry` via its constructor and use the injected instance.

3.  **`apps/backend/src/core/application/services/client-auth.service.ts`**:
    -   **Issue**: Directly imports and calls `getClientConfig`.
    -   **Required Change**: Refactor `ClientAuthService` to accept `ClientRegistry` via its constructor and use the injected instance.

4.  **`apps/backend/src/infra/http/controllers/userinfo.controller.ts`**:
    -   **Issue**: Directly imports and calls `getClientConfig`.
    -   **Required Change**: The controller should receive necessary client info from a use case, not by calling a data-access function directly. This may require adjusting the `GetUserinfoUseCase` to return more data or refactoring the controller's logic.

### Correct Usage (Reference Pattern)

-   **`apps/backend/src/core/use-cases/register-par.ts`**: Correctly depends on the `ClientRegistry` port interface.
-   **`apps/backend/src/core/use-cases/get-userinfo.ts`**: Correctly depends on the `ClientRegistry` port interface.
-   **`apps/backend/src/index.ts`**: Correctly instantiates `DrizzleClientRegistry` and injects it into the use cases. This file will need to be updated to inject the `clientRegistry` into the newly refactored services.

## 3. Conclusion

The path forward is clear. No new technology or complex architectural decisions are needed. The work involves a straightforward but widespread refactoring to align several services and controllers with the existing, correct architectural pattern. All tests that currently mock or use `getClientConfig` will need to be updated to mock the `ClientRegistry` interface instead.
