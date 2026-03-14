# Quickstart: ID Token Claims

## Overview
This feature adds mandatory FAPI 2.0 / Singpass claims to the ID Token and UserInfo response.

## Development Setup

### 1. Database Migration
Ensure the latest schema is applied to the SQLite database.
```bash
cd apps/backend
bunx drizzle-kit push
```

### 2. Testing the Claim Mapping
Run the unit tests for the new claim mapping logic.
```bash
cd apps/backend
bun test tests/core/claims.test.ts
```

## Manual Verification Flow

### 1. Perform Authentication
1. Trigger a login via a client application.
2. Complete the login flow (Password + OTP).
3. The server should now persist the `loa` (2) and `amr` (`["pwd", "otp-sms"]`) in the session.

### 2. Exchange Authorization Code
1. Exchange the authorization code for tokens at the `/token` endpoint.
2. The response will contain an `id_token`.
3. Decode the `id_token` (after JWE decryption) and verify the following claims:
   - `acr`: `urn:singpass:authentication:loa:2`
   - `amr`: `["pwd", "otp-sms"]`
   - `sub_type`: `user`
   - `sub_attributes`: (If identity scopes were requested)

### 3. Call UserInfo Endpoint
1. Call the `/userinfo` endpoint using the `access_token` obtained.
2. Verify the response contains the same claims as the ID Token.

## Configuration
- No new environment variables are required.
- Hardcoded defaults for `identity_coi` ("SG") and `account_type` ("standard") are located in `apps/backend/src/core/domain/claims.ts`.
