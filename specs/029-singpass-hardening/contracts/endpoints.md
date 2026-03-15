# Interface Contracts: Hardened OIDC Endpoints

## Security Invariants (Global)
All endpoints below MUST return the following headers:
- `Cache-Control: no-store`
- `Pragma: no-cache`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`

## 1. Pushed Authorization Request (PAR)
- **Endpoint**: `POST /par`
- **Security**: Client Authentication required.
- **Invariant**: Validates all OIDC parameters upfront and returns `request_uri`.

## 2. Authorization Endpoint
- **Endpoint**: `GET /authorize`
- **Constraint**: MUST reject requests without a valid `request_uri` (enforces PAR).
- **Invariant**: Verifies `state` and `nonce`.

## 3. Token Endpoint
- **Endpoint**: `POST /token`
- **Security**: PKCE `code_verifier` mandatory.
- **Invariant**: `authorization_code` MUST be single-use. Replay detection MUST trigger failure.

## 4. UserInfo / MyInfo
- **Endpoint**: `GET /userinfo`
- **Security**: Validates DPoP binding if token was issued with DPoP.
- **Invariant**: Returns ONLY attributes permitted by authorized scopes.
