# Quickstart: UserInfo Scope Handling

## Overview

This feature extends the system's ability to handle the `mobileno` scope and correctly populate `sub_attributes` in the ID Token and `person_info` in the UserInfo response, adhering to Singpass FAPI 2.0 standards.

## Verification Steps

### 1. Verify Domain Logic

Run the unit tests for the claims mapping logic:

```bash
bun test apps/backend/tests/core/claims.test.ts
bun test apps/backend/tests/core/claims_filtering.test.ts
```

### 2. Verify UserInfo Response

Initiate a UserInfo request using an access token with full scopes:

```bash
# Assuming you have a valid DPoP Access Token and Proof
curl -X GET https://localhost/userinfo \
  -H "Authorization: DPoP <access_token>" \
  -H "DPoP: <dpop_proof>"
```

Expected `person_info` in the decrypted payload:

```json
{
  "person_info": {
    "uinfin": { "value": "S1234567A" },
    "name": { "value": "JOHN DOE" },
    "email": { "value": "john@example.com" },
    "mobileno": { "value": "91234567" }
  }
}
```

### 3. Verify ID Token Claims

Inspect the ID Token returned during the token exchange flow when `user.identity` is requested.
Expected `sub_attributes`:

```json
{
  "sub_attributes": {
    "identity_number": "S1234567A",
    "identity_coi": "SG",
    "account_type": "standard",
    "name": "JOHN DOE"
  }
}
```

## Key Test Scenarios

| Scenario | Scope | Expected Outcome |
|----------|-------|------------------|
| **Full Profile** | `openid uinfin name email mobileno` | All fields in `person_info` and `sub_attributes` |
| **Privacy Check** | `openid` | Empty `person_info: {}`, no `sub_attributes` |
| **Missing Mobileno** | `openid mobileno` | `mobileno` omitted if user has no mobile number |
| **Identity Identity** | `user.identity` | `sub_attributes` with identity fields only |
