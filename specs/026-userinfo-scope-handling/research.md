# Research: UserInfo Scope Handling & person_info Fields

## Current State Analysis

### 1. Data Model & Schema
- The `users` table in `apps/backend/src/infra/database/schema.ts` already contains the `mobileno` column.
- The `UserData` interface in `apps/backend/src/core/domain/userinfo_claims.ts` already includes `mobileno: string | null`.
- The `DrizzleUserInfoRepository` correctly fetches `mobileno` from the database.

### 2. UserInfo Mapping (`mapUserInfoClaims`)
- Resides in `apps/backend/src/core/domain/userinfo_claims.ts`.
- Correctly implements the `person_info` nesting.
- Already handles `uinfin`, `name`, `email`, and `mobileno` scopes for the `person_info` object using the `{ value: "..." }` format.
- **Discrepancy**: The `UserInfoClaims` interface currently includes `sub_attributes`. According to the spec and Singpass docs, `sub_attributes` should primarily reside in the ID Token, while UserInfo focuses on `person_info`.

### 3. ID Token Generation (`TokenService`)
- Resides in `apps/backend/src/core/application/services/token.service.ts`.
- Calls `buildSubAttributes` to populate the `sub_attributes` claim.
- Correctly includes `sub_type: "user"`, `amr`, and `acr`.
- **Discrepancy**: It currently includes `uinfin` as a top-level claim in the ID Token if the scope is present. Singpass docs suggest `identity_number` inside `sub_attributes` is the preferred way for FAPI 2.0.

### 4. Sub-Attributes Builder (`buildSubAttributes`)
- Resides in `apps/backend/src/core/domain/claims.ts`.
- **Logic Issue**: It maps the `uinfin` scope to `sub_attributes.identity_number`. According to the claims matrix in the spec, `identity_number` should only be mapped from the `user.identity` scope.
- **Logic Issue**: It doesn't explicitly handle the case where `identity_number` is missing but `user.identity` is authorized (should still return `identity_coi` and `account_type`).

## Decisions & Rationale

### Decision 1: Refine `buildSubAttributes` Logic
- **Change**: Remove `uinfin` from the trigger for `identity_number`. Only `user.identity` should trigger the identity block in `sub_attributes`.
- **Rationale**: Align with the "Scope -> ID Token sub_attributes Claims Matrix" in the spec.
- **Change**: Ensure `identity_coi` and `account_type` are always present if `user.identity` scope is requested, even if `identity_number` is null.

### Decision 2: Update UserInfo Response Format
- **Change**: Remove `sub_attributes` from the `UserInfoClaims` interface and `mapUserInfoClaims` return object.
- **Rationale**: UserInfo should only return `sub`, `iss`, `aud`, `iat`, `person_info`, `acr`, `amr`, and `sub_type` to match the expected response in the spec and avoid redundant data.

### Decision 3: Update `TokenService` ID Token Claims
- **Change**: Remove the top-level `uinfin` claim from the ID Token.
- **Rationale**: The spec specifies that identity information belongs in `sub_attributes`.

## Implementation Strategy

1. **Test-Driven Development**: Update `apps/backend/tests/core/claims_filtering.test.ts` and `apps/backend/tests/core/claims.test.ts` to reflect the refined mapping rules.
2. **Core Logic Update**: Modify `apps/backend/src/core/domain/claims.ts` and `apps/backend/src/core/domain/userinfo_claims.ts`.
3. **Service Integration**: Update `TokenService` and `GetUserInfoUseCase` if necessary (though they mostly rely on the domain mapping functions).
