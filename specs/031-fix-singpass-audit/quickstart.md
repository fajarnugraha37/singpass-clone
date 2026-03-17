# Quickstart: Testing Singpass Audit Remediation

This guide explains how to verify the compliance fixes identified in the audit report.

## 1. PAR TTL Validation (FR-001)
Verify that the `request_uri` expires in exactly 60 seconds.
1. Initiate a PAR request.
2. Confirm the response `expires_in` is `60`.
3. Wait 61 seconds.
4. Attempt to use the `request_uri` at the authorization endpoint.
5. Expect the server to reject the request as expired.

## 2. State & Nonce Minimum Length (FR-002)
Verify that short `state` and `nonce` parameters are rejected.
1. Initiate a PAR request with `state: "too-short"`.
2. Expect a `400 Bad Request` with a validation error for `state`.
3. Repeat for `nonce`.

## 3. DPoP Nonce Freshness (FR-003, FR-004, FR-005)
Verify that the server enforces DPoP nonces.
1. Make a request to `/api/par` or `/api/token` without a `nonce` in the DPoP proof (when one is required).
2. Expect a `401 Unauthorized` with `WWW-Authenticate: DPoP error="use_dpop_nonce"`.
3. Extract the `DPoP-Nonce` header.
4. Re-submit the request with the nonce in the DPoP proof.
5. Expect a successful response with a *new* `DPoP-Nonce` header.

## 4. Account Type Mapping (FR-006)
Verify that `sub_attributes.account_type` reflects the user's data.
1. Configure a mock user with `account_type: "foreign"`.
2. Complete the OIDC flow for this user.
3. Inspect the `id_token`.
4. Confirm `sub_attributes.account_type` is `"foreign"`.

## 5. Native App Parameters (FR-007)
Verify that optional native launch parameters are accepted.
1. Initiate a PAR request including `redirect_uri_https_type` and `app_launch_url`.
2. Expect a `201 Created` response.
