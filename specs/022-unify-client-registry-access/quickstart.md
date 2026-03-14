# Quickstart: Unify Client Registry Access

**Date**: 2026-03-15

This document provides a quick guide for developers on the correct pattern for accessing client configuration following this refactoring.

## The Correct Pattern: Using the `ClientRegistry` Port

To access client configuration data from within a core service, you **MUST** use the `ClientRegistry` port. This is achieved through Dependency Injection.

### 1. Depend on the Port

In your service's constructor, declare a dependency on the `ClientRegistry` interface.

```typescript
// Example: src/core/services/SomeService.ts

import type { ClientRegistry } from '../ports/ClientRegistry';
import type { SomeOtherDependency } from '...';

export class SomeService {
  constructor(
    private clientRegistry: ClientRegistry,
    private otherDependency: SomeOtherDependency,
  ) {}

  public async someMethod(clientId: string) {
    // ...
  }
}
```

### 2. Use the Port to Get Data

Inside your service's methods, call `getClientConfig` on the injected `clientRegistry` instance. Remember that this is an **asynchronous** operation.

```typescript
// Example: src/core/services/SomeService.ts

// ... inside SomeService class

public async someMethod(clientId: string) {
  const clientConfig = await this.clientRegistry.getClientConfig(clientId);

  if (!clientConfig) {
    // Handle case where client is not found
    throw new Error(`Client with ID ${clientId} not found.`);
  }

  // Use the clientConfig object
  console.log(clientConfig.redirectUris);
}
```

### 3. Wire Up the Dependency

In the main application entry point (`src/index.ts`), ensure the `DrizzleClientRegistry` instance is passed to your service's constructor when it is instantiated.

```typescript
// Example: src/index.ts

import { DrizzleClientRegistry } from './infra/adapters/client_registry';
import { SomeService } from './core/services/SomeService';
// ... other imports

// 1. Instantiate the adapter
const clientRegistry = new DrizzleClientRegistry();

// 2. Inject it into your service
const someService = new SomeService(clientRegistry, otherDependency);

// ...
```

## The Anti-Pattern (To Be Removed)

The following pattern is now **prohibited** and will be removed entirely:

-   **DO NOT** import or use the `getClientConfig` function directly.
-   **DO NOT** access the database or any other data source from within a core domain service.

**Incorrect Code (Legacy):**

```typescript
import { getClientConfig } from '../../infra/adapters/client_registry';

// ... inside a service method
const clientConfig = getClientConfig(clientId); // <-- PROHIBITED
```
