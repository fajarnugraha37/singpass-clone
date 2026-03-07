# Research: FAPI 2.0 Database Schema and Core Utilities

This document summarizes the research and technical decisions for the FAPI 2.0 infrastructure layer, incorporating refinements from the clarification session.

## DPoP & JWT Validation

**Decision**: Use the `jose` library for all JWT and JWKS operations.
**Rationale**: `jose` is a standard, lightweight, and runtime-agnostic library that supports all required FAPI 2.0 cryptographic operations (ES256, JWKS, DPoP).
**Alternatives considered**: 
- `jsonwebtoken`: Lacks native JWKS and DPoP support; heavier.

### DPoP Proof Validation
- Validation MUST include: `jti` uniqueness (checked against the `security_audit_log` or a dedicated `dpop_jtis` table), `iat` within 60s, `htm` (HTTP method) match, and `htu` (HTTP URL) match.
- The `jkt` (JWK Thumbprint) is calculated using SHA-256 of the public key as per RFC 7638.
- **Fail Fast Policy**: Any validation failure results in immediate 400 (PAR) or 401 (Token/UserInfo) error.

## Server Key Management

**Decision**: Store encrypted private keys in a `server_keys` SQLite table.
**Rationale**: Enables key persistence and rotation without external dependencies while maintaining security via encryption at rest.
**Implementation**:
- Algorithm: `aes-256-gcm`.
- Storage: `id` (UUID), `encrypted_key` (Base64), `iv` (Base64), `auth_tag` (Base64), `is_active` (Boolean), `created_at`.
- Master Key: Loaded from `SERVER_KEY_ENCRYPTION_SECRET` environment variable.
- **Key Size**: Minimum 2048-bit equivalent (Standard P-256 curve).

## PAR URI Generation

**Decision**: Use a sequential integer suffix with a standard URN prefix.
**Rationale**: Matches the Singpass specific format `urn:ietf:params:oauth:request_uri:<id>`.
**Implementation**: Use the auto-incrementing `id` from the `par_requests` table.

## Security Audit Logging

**Decision**: Dual-logging approach.
**Rationale**: Critical security events (Auth Fail, DPoP Errors, Client Rejection) are stored in a `security_audit_log` SQLite table for persistent auditing, while all events are sent to structured application logs (JSON) for observability.
**Logged Events**:
- Client Authentication success/failure.
- PAR creation and retrieval.
- DPoP validation success/failure (with failure reason).
- Unknown client ID rejections.

## Input Validation

**Decision**: Use Zod for all request and internal data validation.
**Rationale**: Provides type-safe schemas and strict enforcement of OIDC/FAPI parameter constraints (e.g., single-value parameters).
**Constraint**: Multiple values for single-value parameters (e.g., duplicate `client_id` in form-data) MUST be rejected with `invalid_request`.
