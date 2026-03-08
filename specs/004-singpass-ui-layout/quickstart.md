# Quickstart: Singpass UI Base Layout and Login Screen

Guide for running and verifying the Singpass UI prototype.

## Prerequisites
- Node.js 18+ or Bun 1.1+
- Monorepo infrastructure initialized

## Project Locations
- **Layouts**: `apps/frontend/src/layouts/BaseLayout.astro`
- **Login Island**: `apps/frontend/src/components/LoginCard.svelte`
- **i18n Logic**: `apps/frontend/src/lib/i18n.svelte.ts`
- **Validation**: `apps/frontend/src/lib/nric.ts`

## Getting Started
1. **Install dependencies**:
   ```bash
   bun install
   ```
2. **Run dev server**:
   ```bash
   bun dev --filter frontend
   ```
3. **Open browser**: Navigate to `http://localhost:4321`

## Verification
1. **Tabs**: Click "Singpass App" and "Password Login" tabs. Password Login should be active by default.
2. **NRIC Checksum**: Enter an invalid NRIC (e.g., `S1234567A`) to see the red error message. Try a valid one (e.g., `S9000001B`) to see the error disappear.
3. **i18n**: Select different languages from the header. Verify that all labels, including tabs and buttons, update immediately.
4. **Password Toggle**: Click the "Eye" icon to show/hide the password.
5. **Mobile**: Use browser DevTools to test on iPhone/Android viewports.

## Testing
Run unit tests for NRIC validation and tab switching:
```bash
bun test apps/frontend/tests/
```
