# Feature Specification: Unified HTTPS Architecture

**Feature Branch**: `038-unified-https-arch`  
**Created**: 2026-03-19  
**Status**: Draft  
**Input**: User description: "Transition the vibe-auth monorepo to a Unified HTTPS Architecture (Ports 80/443). Objective: Configure the Hono backend as the primary entry point for the entire platform, serving both the API and the Astro frontend over secure HTTPS with automated certificate management. Key Requirements: 1. Automated TLS Lifecycle (Bun-Native): - Implement a startup check in apps/backend: If server.key and server.crt are missing from the .ssl/ directory, the application must automatically generate a self-signed certificate (e.g., using openssl or a Node-compatible library). - Configure Bun.serve in the Hono entry point to use these credentials for TLS. 2. Unified Port Management: - HTTPS (443): The primary listener for all API and Frontend traffic. - HTTP (80): Implement a global middleware/redirect that force-upgrades all incoming traffic to HTTPS. - Astro Integration: Configure the Hono backend to serve the apps/frontend/dist folder as static assets, ensuring the SPA/SSG frontend is delivered from the same origin as the API. 3. Global Refactoring & Cleanup: - Search and replace all hardcoded port references (3000, 4321) across the codebase, .env files, astro.config.mjs, and root/app README.md files. - Update the Shared RPC Client configuration to use the new unified HTTPS origin. 4. Architecture & Security: - Ensure the static file serving logic in Hono follows Security Best Practices (proper MIME types, cache headers, and directory traversal protection). - Maintain Strict Hexagonal Architecture: Keep the server/port configuration isolated within the Infrastructure/HTTP layer of the backend. Source Material: Reference apps/backend/src/index.ts for current server setup and apps/frontend/astro.config.mjs for build-output configuration."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Secure Access (Priority: P1)

As a user, I want to access the platform via a secure HTTPS connection so that my data is protected during transmission.

**Why this priority**: Security is the foundation of the platform. All authentication flows require HTTPS for integrity and confidentiality.

**Independent Test**: Verify that the server responds on the standard HTTPS port (443) with a valid (or self-signed) TLS certificate and serves the application.

**Acceptance Scenarios**:

1. **Given** the platform is running, **When** I navigate to the secure URL (port 443), **Then** the frontend application should load successfully.
2. **Given** the platform is running, **When** a client makes an API request via HTTPS, **Then** the service should respond correctly.

---

### User Story 2 - Automated HTTP to HTTPS Upgrade (Priority: P2)

As a user, I want to be automatically redirected to a secure connection even if I type the URL without `https://`.

**Why this priority**: Ensures that users don't accidentally use insecure connections, maintaining a high security posture by default.

**Independent Test**: Verify that requests to the standard HTTP port (80) are redirected to the secure port (443).

**Acceptance Scenarios**:

1. **Given** the platform is running, **When** I access the application via port 80, **Then** my browser should be redirected to port 443.

---

### User Story 3 - Automated Certificate Management (Priority: P2)

As a developer, I want the system to handle security certificate generation automatically for local development so that I don't have to manually configure encryption for every environment.

**Why this priority**: Simplifies onboarding and reduces configuration errors in development and staging environments.

**Independent Test**: Remove existing certificates and start the service; verify that new certificates are generated automatically.

**Acceptance Scenarios**:

1. **Given** no security certificates exist, **When** I start the backend service, **Then** a self-signed certificate should be generated in the designated directory.
2. **Given** certificates are generated, **When** the server starts, **Then** it should use these certificates to enable secure communication.

---

### User Story 4 - Unified Origin Experience (Priority: P3)

As a user, I want a seamless experience where the frontend and backend share the same origin, ensuring consistent security policies and simplified access.

**Why this priority**: Simplifies the architecture and improves compatibility with browsers' security policies (e.g., CORS).

**Independent Test**: Verify that frontend assets and API requests share the same host and port.

**Acceptance Scenarios**:

1. **Given** the platform is running on port 443, **When** the frontend makes an API request to a relative path (e.g., `/api/v1/userinfo`), **Then** the request should succeed without cross-origin issues.

---

### Edge Cases

- **Missing Certificate Generation Tools**: What happens if the environment lacks the necessary tools to generate self-signed certificates?
- **Port Conflict**: How does the system handle a situation where port 80 or 443 is already in use by another application?
- **Invalid Certificates**: How does the system handle corrupted or expired certificates in the storage directory?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST automatically generate a self-signed security certificate if one is missing from the designated storage location.
- **FR-002**: System MUST use the certificates to serve all traffic over a secure encrypted connection (standard HTTPS port 443).
- **FR-003**: System MUST listen on the standard HTTP port (80) and redirect all incoming requests to the secure HTTPS port.
- **FR-004**: System MUST serve the frontend application assets directly from the same entry point as the backend service.
- **FR-005**: System MUST ensure that no hardcoded non-standard port references (e.g., 3000, 4321) remain in the codebase or configuration.
- **FR-006**: System MUST update the internal communication clients to use the unified secure origin.
- **FR-007**: System MUST provide proper MIME types and security headers (e.g., HSTS, Content-Security-Policy) for all served assets.

### Assumptions

- **ASM-001**: Self-signed certificates are acceptable for local development and will be replaced by valid CA certs in production environments.
- **ASM-002**: Ports 80 and 443 are available on the host machine or mapped appropriately by the infrastructure.
- **ASM-003**: The backend service has sufficient permissions to write to the designated certificate storage directory.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of HTTP requests (port 80) are successfully upgraded to HTTPS (port 443).
- **SC-002**: First-time setup (without manual certs) completes in under 30 seconds including certificate generation.
- **SC-003**: Zero hardcoded references to temporary development ports found in the repository after cleanup.
- **SC-004**: Frontend assets load successfully from the same origin (host/port) as the API without cross-origin configuration errors.
