# UI Contracts: Singpass UI Base Layout and Login Screen

This document defines the properties and behaviors of the core Svelte components for the Singpass UI.

## `LoginCard.svelte` (Island)

- **Type**: Svelte Island (Client-side interactivity)
- **Properties**:
  - `initialTab`: `"app"` | `"password"` (Default: `"password"`)
- **Behaviors**:
  - Manages the switching between QR and Password tabs.
  - Controls the visibility of validation errors.
  - Handles the "Log In" button interaction in Demo Mode.

## `NricInput.svelte` (Internal)

- **Type**: Svelte Component
- **Properties**:
  - `value`: `string` (bindable)
  - `error`: `string` | `null` (display error message)
- **Behaviors**:
  - Triggers NRIC checksum validation on input change and blur.
  - Formats user input as uppercase.

## `LangSwitcher.svelte` (Island/Internal)

- **Type**: Svelte Island (Client-side interactivity)
- **Behaviors**:
  - Updates the global `locale` store.
  - Re-renders all translated UI elements instantly.

## `PasswordInput.svelte` (Internal)

- **Type**: Svelte Component
- **Properties**:
  - `value`: `string` (bindable)
  - `showToggle`: `boolean` (displays the eye icon)
- **Behaviors**:
  - Toggles between `type="password"` and `type="text"`.
