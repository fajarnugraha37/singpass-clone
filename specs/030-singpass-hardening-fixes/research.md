# Research: Singpass Compliance Hardening

## 1. DPoP Validation (`exp` and `ath` claims)

- **Decision**: Implement `exp` and `ath` claim validation in `DPoPValidator`.
- **Rationale**: This is a direct requirement from the Singpass specification and a critical security measure to prevent replay attacks and ensure the DPoP proof is bound to the access token. The audit report's recommendation is the correct and only approach.
- **Alternatives Considered**: None. This is a mandatory security feature.

## 2. Server JWKS (Encryption Key)

- **Decision**: Extend `DrizzleServerKeyManager` to generate and serve a key with `use: 'enc'`.
- **Rationale**: The Singpass specification requires the server to provide an encryption key for Relying Parties to encrypt data. The current implementation only provides a signing key, which is a compliance violation.
- **Alternatives Considered**: Hardcoding a static encryption key was considered but rejected in favor of dynamic generation to follow the existing pattern for signing keys, allowing for better key rotation and management.

## 3. Client Assertion Validation (`sub`, `aud`, `exp`, `jti`)

- **Decision**: Enhance `JoseCryptoService` and `ClientAuthenticationService` to perform stricter validation on client assertions.
- **Rationale**: The FAPI 2.0 profile, which Singpass follows, requires these strict checks (`iss === sub`, correct `aud`, short `exp`, and `jti` replay prevention). The recommendations from the audit report are necessary for compliance and security.
- **Alternatives Considered**: Implementing this logic directly in the use cases was considered but rejected to keep the validation centralized and reusable, adhering to the DRY principle.

## 4. PKCE Constraints (`code_verifier`)

- **Decision**: Update the Zod schema in `token.controller.ts` to enforce length and character set constraints on the `code_verifier`.
- **Rationale**: While not a critical security flaw, this is a compliance requirement from the specification. Enforcing it in the validation schema is the most efficient and correct place to handle it.
- **Alternatives Considered**: Adding validation in the use case was considered but is less efficient as it would happen after the initial request parsing.

## 5. OIDC Discovery (Encryption Metadata)

- **Decision**: Add the required encryption algorithm metadata to the response of the `discovery.controller.ts`.
- **Rationale**: This is required for compliance and to aid OIDC clients in discovering the server's capabilities. It's a straightforward addition to the existing discovery document.
- **Alternatives Considered**: None. This is a standard part of OIDC discovery.
