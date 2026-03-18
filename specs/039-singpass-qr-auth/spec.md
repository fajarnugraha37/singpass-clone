# Feature Specification: Singpass QR Authentication Flow

**Feature Branch**: `039-singpass-qr-auth`  
**Created**: 2026-03-19  
**Status**: Draft  
**Input**: User description: "Implement the Singpass QR Authentication flow (Production-Ready) within the vibe-auth monorepo. Objective: Replace the static QRPlaceholder.svelte with a functional, real-time QR code that enables secure login via the Singpass App. Key Requirements: 1. Backend (Hono): Implement an adapter and controller to initiate the OIDC/FAPI Pushed Authorization Request (PAR) with the Singpass NDI Sandbox/Production endpoints to retrieve the authenticated QR payload. 2. Frontend (Svelte 5): Refactor the QR component to use $state and $effect runes to fetch, render, and manage the lifecycle of the dynamic QR code. 3. Status Polling: Implement a robust status-tracking mechanism (Long Polling or WebSockets) to detect when the user has successfully authorized the login on their mobile device. 4. Security & Architecture: - Adhere to Strict Hexagonal Architecture: Isolate the Singpass Client logic from the Hono controllers. - Ensure FAPI Conformance: Use JWS/JWE for all token and request object handling. - Use Hono RPC for type-safe status updates between backend and frontend. 5. UX & Resilience: Handle QR expiration (automatic refresh), network timeouts, and specific Singpass error codes (e.g., user cancellation). Source Material: Prioritize technical specifications found in docs/singpass-server/ and docs/singpass/technical-specifications/ as the primary source of truth for the protocol implementation."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Successful Login via Singpass App (Priority: P1)

As a resident, I want to log in securely to the website by scanning a QR code with my Singpass App so that I don't have to remember or type a password.

**Why this priority**: Core value of the feature; replaces legacy authentication methods with a more secure and seamless experience.

**Independent Test**: The user scans the QR code on the desktop screen using the Singpass app. Once authorized on the phone, the desktop browser automatically redirects to the dashboard without any further user interaction.

**Acceptance Scenarios**:

1. **Given** the user is on the login page, **When** they select the "Singpass App" tab, **Then** a dynamic QR code is displayed immediately.
2. **Given** a QR code is displayed, **When** the user scans and authorizes it on their Singpass App, **Then** the browser session is updated to "authenticated" and redirects the user to their profile or dashboard.

---

### User Story 2 - Automated QR Expiration and Refresh (Priority: P2)

As a user, if I am distracted and wait too long to scan the QR code, I want the system to automatically refresh the QR code so that I can still log in without manually reloading the page.

**Why this priority**: Enhances UX by preventing "dead" login screens and handles the short (60s) TTL of Singpass PAR requests.

**Independent Test**: Leave the login page open for more than 60 seconds (or the configured TTL). Verify that the QR code visually refreshes and remains scan-able.

**Acceptance Scenarios**:

1. **Given** a QR code has been displayed for its full validity period (e.g., 60 seconds), **When** it expires, **Then** a new QR code is fetched and rendered automatically without a page reload.
2. **Given** a network failure during a refresh attempt, **When** the refresh fails, **Then** an appropriate error message is shown with a "Retry" button.

---

### User Story 3 - Handling Login Cancellation (Priority: P3)

As a user, if I change my mind and cancel the login on my Singpass App, I want the website to notify me and allow me to try again or choose a different login method.

**Why this priority**: Essential for a robust UX and clear system feedback.

**Independent Test**: Scan the QR code, then tap "Cancel" on the Singpass App. Verify the website displays a "Login cancelled" message.

**Acceptance Scenarios**:

1. **Given** the user is in the process of scanning/authorizing, **When** they cancel the transaction on their mobile device, **Then** the website status polling detects the cancellation and shows a friendly "Authorization cancelled" notice.

---

### Edge Cases

- **Network Interruption**: What happens if the browser loses connection during polling? The system should attempt several retries before showing an "Offline" or "Network Error" message.
- **Clock Skew**: How does the system handle potential clock skew between the RP (vibe-auth) and Singpass? Use standard OIDC `iat`/`exp` tolerances (leeway).
- **Multiple Tabs**: What happens if the user opens two login tabs? Each tab should maintain its own independent QR session and state.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST initiate a FAPI-compliant Pushed Authorization Request (PAR) with Singpass NDI to retrieve a `request_uri`.
- **FR-002**: The system MUST generate a QR code containing the Singpass Authorization URL (e.g., `https://.../auth?client_id=...&request_uri=...`).
- **FR-003**: The backend MUST expose a status-tracking endpoint (via Hono RPC) to allow the frontend to poll for the authentication result.
- **FR-004**: The backend MUST handle the OIDC redirect callback from Singpass and associate the received `code` and `state` with the correct local QR session.
- **FR-005**: The frontend MUST use Svelte 5 runes (`$state`, `$effect`) to manage the lifecycle of the QR code, including polling, timeouts, and automatic refresh.
- **FR-006**: All cryptographic operations (Client Assertion, JWS/JWE handling) MUST adhere to the FAPI 2.0 security profile.
- **FR-007**: The implementation MUST follow the Hexagonal Architecture, isolating the Singpass NDI client logic from the web controllers.

### Key Entities *(include if feature involves data)*

- **QRSession**: Represents a single authentication attempt.
  - `id`: Unique identifier (UUID).
  - `state`: OIDC state parameter.
  - `nonce`: OIDC nonce parameter.
  - `requestUri`: The `request_uri` returned from Singpass PAR.
  - `status`: One of `PENDING`, `AUTHORIZED`, `CANCELLED`, `EXPIRED`, `ERROR`.
  - `authCode`: The authorization code received from Singpass (once authorized).
  - `expiresAt`: Timestamp after which the session/QR code is no longer valid.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of successful Singpass app authorizations result in the user being redirected on the desktop browser within 2 seconds of the phone authorization.
- **SC-002**: QR code automatically refreshes within 1 second of reaching its expiration time.
- **SC-003**: 100% of sensitive data exchanges (PAR request, Token request) use JWS/JWE as required by FAPI 2.0.
- **SC-004**: Zero regressions in the "Password Login" tab functionality after refactoring the QR component.
