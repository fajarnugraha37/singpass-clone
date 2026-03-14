# Quickstart: Verifying DPoP Consolidation

## Overview
This guide describes how to verify that DPoP validation is consolidated and consistent across all endpoints.

## Step 1: Run Unit Tests
Run the comprehensive unit tests for `DPoPValidator` to ensure all rules are correctly enforced.

```bash
bun test apps/backend/tests/unit/dpop_validator.test.ts
```

## Step 2: Verify Endpoint Consistency
Use the integration tests to ensure PAR, Token, and UserInfo endpoints respond identically to invalid DPoP proofs.

### 1. Test Strict HTU (exact match)
Send a proof with `htu` missing a trailing slash or having a different case to any DPoP-protected endpoint.
- **Expected**: 400 Bad Request (PAR/Token) or 401 Unauthorized (UserInfo) with `invalid_dpop_proof: invalid_htu`.

### 2. Test JTI Replay
Send the exact same DPoP proof twice within the replay window.
- **Expected**: First request succeeds (or fails for other reasons); second request fails with `invalid_dpop_proof: jti_reused`.

## Step 3: Verify Code Consolidation
Ensure redundant methods are removed and only one validator is used.

1. `grep -r "validateDPoPProof" apps/backend/src` should return NO results in `CryptoService` or `JoseCryptoService`.
2. `ls apps/backend/src/core/utils/dpop.ts` should confirm the file is deleted.
3. Check `RegisterParUseCase`, `TokenExchangeUseCase`, and `GetUserInfoUseCase` to confirm they all inject and use `DPoPValidator`.
