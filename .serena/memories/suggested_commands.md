# Suggested Development Commands

## Project-Wide
- `bun install`: Install all dependencies
- `bun test`: Run all tests in the monorepo
- `bun run dev`: Start all dev servers (Astro + Hono)

## Backend (`apps/backend`)
- `cd apps/backend; bun test`: Run backend-specific tests
- `cd apps/backend; bun test <path/to/file>.test.ts`: Run a specific test file
- `cd apps/backend; bun x drizzle-kit push`: Sync schema to local `backend.db`
- `cd apps/backend; bun x drizzle-kit studio`: Open Drizzle Studio to browse DB

## Frontend (`apps/frontend`)
- `cd apps/frontend; bun run dev`: Start Astro dev server

## Tooling
- `bun x prettier --write .`: Format all files
- `bun x eslint .`: Lint the codebase
