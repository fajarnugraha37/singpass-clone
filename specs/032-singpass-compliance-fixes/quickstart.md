# Quickstart: Singpass Compliance Audit Remediation

## High-Level Execution Plan

1.  **Shared Config**: Update `parRequestSchema` with `purpose`.
2.  **Database Schema**: Add `purpose` column to `par_requests`.
3.  **Domain Models**:
    *   Update `UserInfoClaims` and `MyinfoPerson` to include metadata fields.
    *   Update `PersonInfoField` to include `source`, `classification`, `lastupdated`.
4.  **Use Cases**:
    *   `ValidateLoginUseCase`: Assign `user.id` to `session.userId`.
    *   `RegisterParUseCase`: Enforce `purpose` and DPoP nonce validation.
    *   `GetUserInfoUseCase`: Enforce DPoP nonce validation.
5.  **Mappers**:
    *   Update `mapMyinfoProfile` and `mapUserInfoClaims` to include metadata.
6.  **Controllers**:
    *   Ensure all endpoints return `DPoP-Nonce` on both success and 401/400 errors.
7.  **Migrations & Seeds**:
    *   Apply database migration for `purpose`.
    *   Update seeds to include metadata for users.

## Verification Checklist

- [ ] `GET /.well-known/openid-configuration` (Verify nothing broke)
- [ ] `POST /api/par` with `purpose` (Verify it's stored)
- [ ] `POST /api/par` WITHOUT `purpose` (Verify 400 error)
- [ ] `POST /api/login` (Verify `session.userId` is a UUID)
- [ ] `POST /api/token` (Verify `id_token` `sub` is a UUID)
- [ ] `POST /api/token` with/without DPoP nonce (Verify enforcement)
- [ ] `GET /api/userinfo` (Verify attribute metadata structure)

## Critical Code Locations

- `packages/shared/src/config.ts`: `parRequestSchema`
- `apps/backend/src/infra/database/schema.ts`: `parRequests` table
- `apps/backend/src/core/use-cases/ValidateLogin.ts`: `userId` assignment
- `apps/backend/src/core/use-cases/register-par.ts`: Nonce enforcement
- `apps/backend/src/core/use-cases/get-userinfo.ts`: Nonce enforcement
- `apps/backend/src/application/mappers/myinfo-mapper.ts`: Metadata mapping
