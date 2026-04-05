# Gap Implementation Plan: Vibe-Auth Developer & Admin Console

**Context**: This plan addresses the missing requirements from the original feature specification for the Vibe Management Console.

## 1. Developer Self-Service Registration
**Goal**: Allow new developers to sign up for an account.
- **Backend (`iam/service.ts`)**: 
  - Add `registerDeveloper(email: string)` method to insert a new developer record into the `developers` table.
  - Expose via POST `/api/mgmt/auth/register`.
- **Frontend**:
  - Update `Login.svelte` to include a "Register" mode/button.
  - When in register mode, hitting "Request OTP" will first call the register endpoint, then proceed to the OTP flow.

## 2. Developer Client Update (Edit)
**Goal**: Allow developers to edit existing client configurations (Redirect URIs, Scopes, JWKS, etc).
- **Backend (`clients/service.ts`)**:
  - Implement `updateClient(developerId, clientId, data)` to apply partial updates to the `clients` table.
  - Expose via PUT `/api/mgmt/me/clients/:clientId` (already defined in `mgmtRouter.ts` but needs implementation in controller and service).
- **Frontend**:
  - Update `ClientManager.svelte` to support an "Edit" modal.
  - Pre-fill the modal with the selected client's data.
  - Submit updates via the PUT endpoint.

## 3. Developer Client Activation/Deactivation
**Goal**: Allow developers to toggle their clients active/inactive without soft-deleting.
- **Backend (`clients/service.ts`)**:
  - Implement `toggleClientStatus(developerId, clientId, isActive: boolean)`.
  - If toggled to inactive, automatically revoke all active sessions for that client (re-use session revocation logic).
  - Expose via PATCH `/api/mgmt/me/clients/:clientId/status`.
- **Frontend**:
  - Add a toggle/button in `ClientManager.svelte` to change the active status.

## 4. Developer Session View & Revocation
**Goal**: Allow developers to view and revoke active sessions tied to their own clients.
- **Backend (`sessions/service.ts`)**:
  - Implement `listDeveloperSessions(developerId, pagination)` to query sessions joined with the `clients` table where `clients.developerId = developerId`.
  - Expose via GET `/api/mgmt/me/sessions`.
  - Ensure the existing `revokeSession` endpoint for developers verifies that the session belongs to one of their clients before deleting.
- **Frontend**:
  - Add a new "Active Sessions" tab to the Developer Dashboard (`index.astro` / new component `DeveloperSessions.svelte`).
  - Display sessions with a "Revoke" button.

## 5. Sandbox User Deactivation
**Goal**: Allow admins to toggle a Sandbox user's status between active and deactivated.
- **Backend (`sandbox/service.ts`)**:
  - Implement `toggleSandboxUserStatus(userId, status: 'active' | 'deactivated')`.
  - Expose via PATCH `/api/mgmt/admin/sandbox/users/:userId/status`.
- **Frontend**:
  - Update `SandboxManager.svelte` to display current status.
  - Add a toggle/button to change status.

## 6. Sandbox User Password Reset
**Goal**: Allow admins to manually override a Sandbox user's password.
- **Backend (`sandbox/service.ts`)**:
  - Implement `resetSandboxUserPassword(userId, newPassword)`. Hash the new password and update the `users` table.
  - Expose via POST `/api/mgmt/admin/sandbox/users/:userId/reset-password`.
- **Frontend**:
  - Update `SandboxManager.svelte` to include a "Reset Password" action for each user.
  - Prompt the admin for a new password (or auto-generate a strong one like `test1234`).

## Execution Order
1. **Core Domain Updates**: Implement all missing backend service methods.
2. **RPC Endpoints**: Wire up the new methods in `mgmt.controller.ts` and `mgmtRouter.ts`.
3. **RPC Client & Shared Contracts**: Ensure `packages/shared/src/contracts/mgmt.ts` is up to date with the new endpoints.
4. **Frontend UI**: Implement the new modals, tabs, and buttons in Svelte.