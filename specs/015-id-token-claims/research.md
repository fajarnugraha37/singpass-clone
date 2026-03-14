# Research: ID Token Claims (acr, amr, sub_type, sub_attributes)

## Context
The goal is to include mandatory FAPI 2.0 / Singpass claims in the ID Token and UserInfo response.

## Findings

### 1. Current ID Token Generation
- **Location**: `apps/backend/src/core/application/services/token.service.ts`
- **Method**: `generateIdToken`
- **Current Claims**: `iss`, `sub`, `aud`, `iat`, `exp`, `nonce`.
- **Encryption**: Uses `generateEncryptedIDToken` from `crypto.ts` (JWS-in-JWE).

### 2. UserInfo Generation
- **Location**: `apps/backend/src/core/use-cases/get-userinfo.ts`
- **Claims**: Currently only `sub` and `scopes` are passed to `signAndEncrypt`.
- **Missing**: `sub_attributes` based on scopes.

### 3. Session and Auth Context
- **Table**: `sessions` in `apps/backend/src/infra/database/schema.ts` has `loa` (integer) but lacks `amr` (Authentication Methods Reference).
- **Table**: `access_tokens` lacks `loa` and `amr` columns, making it difficult for the UserInfo endpoint to know the authentication context of the token without joining with `sessions`.
- **Data Service**: `DrizzleAuthDataService` handles session updates but doesn't track `amr`.

### 4. Data for `sub_attributes`
- **Table**: `users` contains `nric`, `name`, `email`, and `mobileno`.
- **Mapping**:
  - `user.identity` -> `identity_number` (NRIC), `identity_coi` ("SG"), `account_type` ("standard").
  - `name` -> `name`.
  - `email` -> `email`.
  - `mobileno` -> `mobileno`.

## Decisions

### 1. Schema Updates
- **`sessions` table**: Add `amr` column (text, JSON/stringified array).
- **`access_tokens` table**: Add `loa` and `amr` columns to avoid complex joins and ensure the token captures the auth context at the time of issuance.

### 2. Domain & Service Updates
- **`Session` & `AuthCodeSessionData` interfaces**: Add `amr: string[]`.
- **`AuthDataService.updateSession`**: Update signature to accept `amr`.
- **`TokenService.generateTokens`**: Should receive `loa` and `amr` from the `TokenExchangeUseCase`.

### 3. Claim Mapping Logic
- Implement a utility to build the `sub_attributes` object based on authorized scopes.
- `acr` mapping:
  - 1 -> `urn:singpass:authentication:loa:1`
  - 2 -> `urn:singpass:authentication:loa:2`
  - 3 -> `urn:singpass:authentication:loa:3`

## Rationale
- Storing `loa` and `amr` in `access_tokens` follows the principle of tokens being self-contained or easily resolvable in a high-performance FAPI environment.
- Using a stringified array for `amr` in SQLite is the most straightforward approach given the tech stack.

## Alternatives Considered
- **Joining with Sessions in UserInfo**: Rejected because sessions might expire while access tokens are still valid, and we want to preserve the auth context of the specific login event.
