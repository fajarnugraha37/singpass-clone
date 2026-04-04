# Phase 0: Outline & Research

## 1. Svelte 5 Runes for Dashboard State Management
- **Decision**: Use `$state`, `$derived`, and `$props` strictly for all reactive state across dashboard components. Use native Fetch/Hono RPC inside asynchronous functions wrapped in `$state` for loading states instead of external fetching libraries.
- **Rationale**: Svelte 5 provides fine-grained reactivity using Runes, eliminating the need for `export let` and reactive declarations (`$:`) from Svelte 4. It integrates seamlessly into Astro islands and ensures high performance without bulky state managers.
- **Alternatives considered**: Zustand or Svelte stores (deprecated in favor of Runes).

## 2. Role-Based Access Control (RBAC) in Hono
- **Decision**: Create an auth middleware in `apps/backend/src/adapters/http/middleware/rbac.ts` that decodes session cookies, verifies the user role (`developer` vs `admin`), and attaches the user payload to the Hono Context (`c.set('user', user)`).
- **Rationale**: Secures all management API routes centrally. It ensures endpoints strictly check permissions before invoking Hexagonal domain services.
- **Alternatives considered**: Implementing checks at the domain service level, which risks exposure if a developer forgets to invoke the check inside an endpoint.

## 3. Server-Side Cursor-Based Pagination
- **Decision**: Implement cursor-based pagination using `id` and `created_at` in Drizzle ORM queries for the Admin God Mode dashboard. Return a `nextCursor` string (Base64 encoded JSON of the last item's cursor values).
- **Rationale**: Offset-based pagination becomes extremely slow for large datasets (>1000 items) and is prone to data skipping/duplication on active tables. Cursor-based pagination scales infinitely.
- **Alternatives considered**: Offset-based pagination (rejected due to explicit requirement and scale expectations).

## 4. "Faker" Utility for Singpass Data
- **Decision**: Use the `@faker-js/faker` library to procedurally generate synthetic but valid-looking Singaporean identity data (e.g., generating NRICs using a valid modulo-11 checksum algorithm, typical Singaporean names).
- **Rationale**: Real PII cannot be used in Sandbox. A deterministic script or standard faker package provides a robust baseline for testing Sandbox MyInfo integrations.
- **Alternatives considered**: Static JSON payload dumps. Rejected because dynamic, unique data points per user are necessary for diverse test scenarios.

## 5. Soft-Deletion and Session Revocation
- **Decision**: Add a `deleted_at` timestamp column to OIDC clients. When a client is soft-deleted, trigger a Domain Event (or direct domain service call) that automatically deletes/invalidates all active sessions associated with that `client_id` in the `sessions` table.
- **Rationale**: Immediate revocation enforces strict security constraints and avoids orphaned sessions that could be maliciously utilized.
- **Alternatives considered**: Natural session expiration. Rejected due to the explicit security decision made during specification clarification.