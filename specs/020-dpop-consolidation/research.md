# Research: DPoP Validator Consolidation

## Findings

### 1. Existing Implementations
- **`DPoPValidator` (core/utils/dpop_validator.ts)**: Currently used by `TokenExchangeUseCase` and `GetUserInfoUseCase`. It handles signature verification, `htm`/`htu` checks, `iat` tolerance, `jti` replay protection (via `JtiStore`), and `jkt` binding.
- **`JoseCryptoService.validateDPoPProof` (infra/adapters/jose_crypto.ts)**: A wrapper around `DPoPValidator`. It is used by `RegisterParUseCase`.
- **`dpop.ts` (core/utils/dpop.ts)**: Indicated as a separate implementation in the feature description, but not found in the current file system check. It might have been a legacy file or a planned implementation that was superseded by `dpop_validator.ts`.

### 2. Inconsistencies and Issues
- **HTU Matching**: The current `DPoPValidator` normalizes the URL (stripping query and fragment) but performs an exact match on the resulting string. The goal is to ensure this strictness is maintained and used everywhere.
- **JTI Replay Protection**: Already implemented in `DPoPValidator` using `JtiStore`. `JoseCryptoService` injects `DrizzleJtiStore`.
- **Duplication**: `RegisterParUseCase` uses `CryptoService.validateDPoPProof`, while other use cases use `DPoPValidator` directly. The `CryptoService` interface should not be burdened with utility-level DPoP validation if a dedicated validator exists.

### 3. JTI Storage Strategy
- The current `used_jtis` table in SQLite is sufficient for replay protection.
- `DrizzleJtiStore` correctly implements the `JtiStore` interface.

## Decisions
- **Unified Validator**: Use `DPoPValidator` as the single source of truth for DPoP validation.
- **Strict HTU**: Refine the `htu` check in `DPoPValidator` to ensure it's as strict as possible, potentially taking the raw intended URI if available, but stripping query/fragment is standard.
- **Interface Cleanup**: Remove `validateDPoPProof` from `CryptoService`. Use cases should inject `DPoPValidator` directly, following the pattern in `TokenExchangeUseCase`.
- **PAR Refactoring**: Update `RegisterParUseCase` to use `DPoPValidator`.

## Rationale
- Centralizing logic in `DPoPValidator` simplifies testing and ensures consistent security behavior across all endpoints.
- Removing it from `CryptoService` adheres to the Interface Segregation Principle; `CryptoService` should focus on low-level cryptographic operations (signing, encrypting) rather than protocol-level validation (DPoP).

## Alternatives Considered
- Keeping it in `CryptoService`: Rejected as it creates a bloated interface and mixes concerns.
- Moving validation to middleware: Considered, but DPoP validation often requires business context (like `clientId` for JTI uniqueness and `expectedJkt` for token binding), making it more suitable for use cases or dedicated decorators/utilities.
