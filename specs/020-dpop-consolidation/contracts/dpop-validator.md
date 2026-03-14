# Contract: DPoP Validator Interface

## Overview
The `DPoPValidator` provides a centralized, unified mechanism for validating DPoP proofs as defined in RFC 9449. It is used by the PAR, Token, and UserInfo endpoints.

## Interface: `DPoPValidator`

### Method: `validate`
Validates a DPoP proof against the current request and client context.

**Parameters**:
- `clientId` (string): The client's unique identifier.
- `options` (DPoPValidationOptions):
  - `proof` (string): The DPoP proof JWT.
  - `method` (string): The HTTP method of the current request (e.g., "POST").
  - `url` (string): The full HTTP URL of the current request.
  - `expectedJkt` (string, optional): The thumbprint of the expected public key (for binding check).
  - `expectedNonce` (string, optional): The expected nonce (if nonce-based protection is enabled).

**Returns**: `Promise<DPoPValidationResult>`
- `isValid` (boolean): Whether validation succeeded.
- `jkt` (string): The thumbprint (S256) of the public key in the proof.
- `payload` (Record<string, any>, optional): The decoded and verified JWT payload.
- `error` (string, optional): Error code (e.g., "invalid_htu", "jti_reused", "invalid_htm").

## Validation Rules
1. **Header**: `typ` MUST be `dpop+jwt`, `jwk` MUST be present.
2. **Signature**: Verified against the provided `jwk`.
3. **Claims (Mandatory)**: `htu`, `htm`, `jti`, `iat`.
4. **HTU Matching**: Exact string match after query and fragment removal.
5. **HTM Matching**: Exact case-sensitive match (e.g., "POST").
6. **IAT Check**: Must be within ±120 seconds of the server's current time.
7. **JTI Replay Protection**: `jti` MUST NOT have been used by the `clientId` within the replay window.
8. **JKT Binding (Optional)**: If `expectedJkt` is provided, the thumbprint of the `jwk` MUST match exactly.
