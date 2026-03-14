# Contract: UserInfo 401 Unauthorized Response

## HTTP Interface

### Endpoint
`GET /api/userinfo`
`POST /api/userinfo`

### Response

- **Status Code**: `401 Unauthorized`
- **Header**: `WWW-Authenticate`
- **Body**: JSON object with `error` and `error_description` fields.

#### Scenario: Missing/Invalid Authorization Header
- **WWW-Authenticate**: `DPoP error="invalid_token", error_description="Missing or invalid Authorization header"`

#### Scenario: Expired/Invalid Access Token
- **WWW-Authenticate**: `DPoP error="invalid_token", error_description="The access token is invalid or has expired"`

#### Scenario: Missing/Invalid DPoP Header
- **WWW-Authenticate**: `DPoP error="invalid_dpop_proof", error_description="Missing DPoP header"` (or specific DPoP error)

#### Scenario: Malformed Request
- **WWW-Authenticate**: `DPoP error="invalid_request", error_description="[Detail]"`
