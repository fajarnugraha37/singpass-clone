# Quickstart: Vibe-Auth Developer & Admin Console

## Setup the Environment
Ensure your local database is updated with the new tables for the management console:
```bash
bun run apps/backend/check_migrations.ts
```

## Hydrate Sandbox Data
Run the seeding utility to generate the default Admin, default Developer, and 10 synthetic Singpass Sandbox Users.
```bash
cd apps/backend
bun run src/scripts/seed.ts
```
*(Note: Default passwords for seeded accounts are `test1234`)*

## Running the Application
Start both the Hono backend and the Astro frontend:
```bash
# From the monorepo root
bun run dev
```

## Testing the Developer Portal
1. Navigate to `http://localhost:4321/developer/login`.
2. Enter the default Developer email (e.g., `developer@example.com`).
3. Check your terminal running the backend; the Mock Email Service will print your 6-digit OTP.
4. Enter the OTP to log in.
5. In the dashboard, click "Create Client" to register a new OIDC client and configure its scopes/callback URIs.

## Testing the Admin God Mode
1. Navigate to `http://localhost:4321/admin/login`.
2. Enter the default Admin email (e.g., `admin@example.com`) and retrieve the OTP from the terminal.
3. Access the God Mode dashboard to view global lists of all Developers, OIDC Clients, Sandbox Users, and active Sessions.
4. Use the "Faker" button on the Sandbox Users tab to generate a new valid test identity.