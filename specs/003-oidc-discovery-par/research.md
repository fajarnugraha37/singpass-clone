# Phase 0: Research & Decisions

## Source of Truth (Principle V)
- **Primary Source**: docs/singpass-server/01-openid-discovery.md (for Discovery/JWKS structure)
- **Primary Source**: docs/singpass-server/02-pushed-authorization-request.md (for PAR validation/storage)
- **Validation**: All decisions below are derived strictly from the technical requirements defined in these local specifications.


## Decision 1: Target Framework and Language
- **Decision**: TypeScript on Bun using Hono framework.
- **Rationale**: Strictly aligned with the Constitution (I. Architecture Design, Development Philosophy) that specifies Hono and Bun for backend services.
- **Alternatives considered**: Node.js with Express, but rejected to maintain architecture and monorepo consistency constraints defined in the Constitution.

## Decision 2: Storage Mechanism for PAR
- **Decision**: SQLite via Drizzle ORM with passive TTL cleanup.
- **Rationale**: The spec clarification dictates: "Moderate volume; passive cleanup (e.g., TTL-based queries or periodic cron) is sufficient". SQLite is the mandatory storage choice per the constitution. When looking up a request URI, the query will additionally enforce `WHERE expires_at > now()`.
- **Alternatives considered**: An active memory cache (e.g., Redis) or background worker, which were rejected to avoid over-engineering based on the moderate volume requirement.

## Decision 3: Cryptography and Security
- **Decision**: Use `jose` library for JWT/JWKS/DPoP operations, as already present in the backend setup.
- **Rationale**: The endpoint requires EC `ES256` keys handling, generation of `jwks` document for `/.well-known/keys`, and robust DPoP header and `client_assertion` JWT validations. `jose` is the industry standard for these tasks in modern JS/TS environments and provides robust FAPI support.
- **Alternatives considered**: Custom crypto utilities or `jsonwebtoken`, which offer inadequate support for complex JWT configurations like DPoP proof generation/validation compared to `jose`.
