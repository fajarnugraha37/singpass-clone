# Technical Research & Decisions: Singpass Implementation Conformance Auditor

## Unknowns Addressed

1. **Tool Format & Location**: Should the auditor be a standalone package, a script in the backend tests, or a separate app?
2. **Testing Framework**: What testing or assertion framework should the auditor use?
3. **HTTP Client**: What library to use for executing the OIDC flow?
4. **JWT Validation**: How to fetch JWKS and validate tokens (ES256/RS256)?

## Decisions & Rationale

### 1. Tool Format & Location
- **Decision**: Create a new package `packages/conformance` containing the auditor as a standalone Bun CLI tool.
- **Rationale**: Isolates the testing logic from the core backend. This allows it to be run against the local backend during CI, or against a staging deployment.
- **Alternatives considered**: Adding as tests in `apps/backend/tests`. Rejected because the auditor is conceptually a separate client interacting with the server.

### 2. Testing Framework
- **Decision**: Use `bun:test` for assertions, wrapped in a custom runner that outputs the required markdown/json report.
- **Rationale**: `bun:test` is built-in and fast.
- **Alternatives considered**: Jest, Vitest. `bun:test` is standard for this monorepo.

### 3. HTTP Client
- **Decision**: Native `fetch` API.
- **Rationale**: Standard, zero dependencies, built into Bun, easily handles DPoP headers, PAR requests, and redirects.

### 4. JWT Validation & PKCE
- **Decision**: `jose` library (already used in the project, see context).
- **Rationale**: Robust, standard-compliant library for handling JWKS fetching and token validation (RS256/ECDSA).

### 5. Config/Developer Portal Verification
- **Decision**: Provide configuration verification via static JSON file input, or environmental flags, to simulate SDP (Singpass Developer Portal) state.
- **Rationale**: The tool needs to verify if the server's state matches an expected app config.

## Best Practices Identified
- OIDC Conformance testing typically requires an interactive or semi-interactive runner. We will automate as much as possible using programmatic HTTP calls.
- Strict isolation of keys and secrets: The auditor must not log secrets.
