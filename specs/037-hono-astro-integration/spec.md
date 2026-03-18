# Feature Specification: Full-stack Hono-Astro Integration

**Feature Branch**: `037-hono-astro-integration`  
**Created**: 2026-03-19  
**Status**: Draft  
**Input**: User description: "Specify the full-stack integration between the Hono backend (apps/backend) and the Astro SSG frontend (apps/frontend). The specification must enforce SSG constraints, defining: 1) adherence to the Hexagonal Architecture mandates, DRY & KISS Principals and follow bun monorepo structure. 2) Client-side Hono RPC instantiation within Svelte islands for dynamic auth flows 3) Runtime session/metadata fetching (e.g., Client Name for SDP compliance) on component mount 4) Build-time data fetching via 'getStaticPaths' for public documentation/registry pages, and 5) A unified contract in packages/shared that ensures type-safe communication between the static UI and the JSON API."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Dynamic Auth Flow (Priority: P1)

As a user, I want to see my session status (logged in/out) and my name (e.g., Client Name for SDP) immediately after the page loads, so I can interact with protected features and feel recognized by the system.

**Why this priority**: This is the core functionality for any authenticated flow within the application. Without dynamic session detection, the user experience is broken for authenticated users on static pages.

**Independent Test**: Can be tested by mounting a Svelte component in an Astro page that calls the Hono RPC backend on mount. Verification is successful if "Loading..." transitions to "Hello, [Client Name]" for authenticated users.

**Acceptance Scenarios**:

1. **Given** a user is logged in with a valid session cookie, **When** the Svelte component mounts on an Astro page, **Then** it must successfully call the backend RPC and display the `Client Name`.
2. **Given** a user is not logged in, **When** the Svelte component mounts, **Then** it must handle the unauthorized response gracefully and display a "Login" call-to-action.

---

### User Story 2 - Public Documentation Registry (Priority: P2)

As a developer or visitor, I want to browse public documentation and registry pages that are pre-rendered at build time, ensuring fast load times and excellent SEO.

**Why this priority**: Essential for non-authenticated content like technical documentation and public registries which are the primary entry points for new users.

**Independent Test**: Verify that `.html` files for all documentation paths are generated in the `dist/` directory after running `astro build`, and that they contain the correct content without requiring JavaScript to be enabled.

**Acceptance Scenarios**:

1. **Given** a set of documentation data (e.g., from a JSON file or API), **When** the site is built, **Then** Astro's `getStaticPaths` must iterate through all entries and generate a static page for each.
2. **Given** a documentation page URL, **When** accessed by a browser with JavaScript disabled, **Then** the full content must be visible.

---

### User Story 3 - Type-Safe Communication (Priority: P3)

As a developer, I want to use shared types between the Hono backend and the Astro frontend, so that I get autocompletion and catch breaking changes at compile time rather than runtime.

**Why this priority**: Critical for long-term maintainability and reducing bugs in the communication layer between the two primary applications.

**Independent Test**: Modify a field name or type in the shared API contract in `packages/shared`. Verification is successful if both `apps/backend` and `apps/frontend` fail their respective type-check builds.

**Acceptance Scenarios**:

1. **Given** a unified contract in `packages/shared`, **When** I use the Hono RPC client in the Astro/Svelte code, **Then** the IDE must provide autocompletion for all endpoints, request parameters, and response fields.
2. **When** an API response format changes in the backend, **Then** the frontend build must fail until the usage is updated to match the new contract.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST strictly adhere to Hexagonal Architecture, ensuring domain logic is decoupled from infrastructure adapters (Hono for API, Astro for UI).
- **FR-002**: System MUST implement Hono RPC for all client-side API interactions within Svelte islands.
- **FR-003**: System MUST perform runtime session/metadata fetching (e.g., Client Name) using the `onMount` lifecycle hook in Svelte components.
- **FR-004**: System MUST utilize Astro's `getStaticPaths` for build-time data fetching of public documentation and registry pages.
- **FR-005**: System MUST centralize API contracts and shared types in `packages/shared` to enable type-safe communication.
- **FR-006**: System MUST follow DRY (Don't Repeat Yourself) and KISS (Keep It Simple, Stupid) principles, particularly in sharing validation logic and types.
- **FR-007**: System MUST leverage the Bun monorepo structure for unified dependency management and script execution.

### Key Entities *(include if feature involves data)*

- **SessionContext**: Represents the current user's session state, including authentication status and basic identity attributes.
- **ClientMetadata**: Descriptive information about an OIDC client (e.g., Name, Logo URL) used for display in the UI and SDP compliance.
- **APIContract**: The source of truth for all network communication, defining endpoints, methods, request schemas, and response structures.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% type safety achieved between the backend API and the frontend client as verified by `bun x tsc --noEmit`.
- **SC-002**: Initial page load for documentation registry exhibits zero "Cumulative Layout Shift" (CLS) related to content loading.
- **SC-003**: Dynamic session hydration (fetching and displaying user info) completes in less than 250ms after the `DOMContentLoaded` event on a 4G connection.
- **SC-004**: Architecture audit confirms zero imports of backend-specific dependencies (e.g., Drizzle, Database drivers) within the frontend application code.
