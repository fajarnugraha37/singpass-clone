# Quickstart: UserInfo Authentication Headers

## Testing the Changes

### Prerequisites
- Running backend: `npm run dev --filter backend`
- Valid client registered for DPoP flows.

### Verification Scenarios

#### 1. Missing Authorization Header
```bash
curl -v -X GET http://localhost:3000/api/userinfo
```
- **Expectation**: 401 status with `WWW-Authenticate: DPoP error="invalid_token", error_description="Missing or invalid Authorization header"`.

#### 2. Expired or Invalid Token
```bash
curl -v -X GET http://localhost:3000/api/userinfo \
  -H "Authorization: DPoP invalid-token" \
  -H "DPoP: [valid-dpop-proof]"
```
- **Expectation**: 401 status with `WWW-Authenticate: DPoP error="invalid_token", error_description="The access token is invalid or has expired"`.

#### 3. Missing DPoP Header
```bash
curl -v -X GET http://localhost:3000/api/userinfo \
  -H "Authorization: DPoP [valid-token]"
```
- **Expectation**: 401 status with `WWW-Authenticate: DPoP error="invalid_dpop_proof", error_description="Missing DPoP header"`.

## Automated Tests
- Run controller tests: `bun test apps/backend/tests/infra/http/controllers/userinfo.controller.test.ts`
- Ensure new test cases for `WWW-Authenticate` are included and passing.
