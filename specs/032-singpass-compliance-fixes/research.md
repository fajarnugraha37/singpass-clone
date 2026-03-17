# Research: Singpass Compliance Audit Remediation

## Decision: NRIC to UUID Migration
- **Finding**: `ValidateLoginUseCase.ts` incorrectly sets `session.userId` to the user's NRIC.
- **Decision**: Update `ValidateLoginUseCase` to use the database-generated UUID (`user.id`) for the session.
- **Rationale**: Mandated by Singpass Login Key Principles for privacy and forward-compatibility with production Singpass OP.
- **Alternatives Considered**: 
    - Using a hashed NRIC: Rejected because a database UUID is more stable and follows the project's established schema.
    - Storing both NRIC and UUID in session: Rejected to maintain a single source of truth for the subject identifier.

## Decision: PAR Purpose Parameter
- **Finding**: `parRequestSchema` and `parRequests` database table are missing the mandatory `purpose` parameter.
- **Decision**: 
    1. Add `purpose: z.string().min(1)` to `parRequestSchema` in `packages/shared`.
    2. Add `purpose` column to `par_requests` table in the database schema.
    3. Update `RegisterParUseCase` to store and return the purpose.
- **Rationale**: Required for PDPA compliance and informed consent in MyInfo v5.
- **Alternatives Considered**: 
    - Keeping purpose inside the `payload` JSON: Rejected because it's a top-level requirement that deserves explicit storage for auditability and display logic.

## Decision: DPoP-Nonce Enforcement
- **Finding**: Inconsistent enforcement of DPoP nonces across endpoints. `RegisterPar` and `GetUserInfo` do not validate nonces.
- **Decision**: 
    1. Update `RegisterParUseCase` and `GetUserInfoUseCase` to enforce nonce validation using `cryptoService.validateDPoPNonce`.
    2. Ensure all controllers correctly handle the `DPoP-Nonce` header.
- **Rationale**: Required for FAPI 2.0 compliance to prevent replay attacks.
- **Alternatives Considered**: 
    - State-based nonces: Rejected in favor of the existing stateless (signed JWT) nonce mechanism in `JoseCryptoService` for better scalability.

## Decision: MyInfo Metadata Mapping
- **Finding**: `mapMyinfoProfile` fails to include standard metadata fields (`source`, `classification`, `lastupdated`).
- **Decision**: Update `MyinfoPerson` domain model and the mapper to include these fields for every attribute.
- **Rationale**: Essential for RPs to test government-verified data logic and "Display As-Is" principles.
- **Alternatives Considered**: 
    - Global metadata: Rejected because Singpass specifies metadata per attribute.
