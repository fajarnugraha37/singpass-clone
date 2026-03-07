# Client Implementation: Token Exchange

## Overview
After successfully receiving the `authorization_code` from the Singpass redirect, the client must exchange it for an `id_token` and an `access_token` by making a POST request to the `/token` endpoint.

## Steps to Execute

### 1. Prepare Cryptographic Materials
- **Client Assertion**: Generate a new JSON Web Token (JWT) signed by your client's registered Private Key (RS256/ES256), just like in the PAR step.
- **DPoP Proof**: Generate a new DPoP JWT signed by the same DPoP key pair used during PAR.
  - Set `htm` to `POST`.
  - Set `htu` to the URL of the token endpoint.
  - Set `jti` to a unique identifier.

### 2. Formulate the Token Request Payload
Build an `application/x-www-form-urlencoded` payload containing:
- `grant_type=authorization_code`
- `redirect_uri` (Must exactly match the one used in PAR)
- `code` (The authorization code received in the callback)
- `code_verifier` (The raw PKCE string you generated and stored during PAR)
- `client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer`
- `client_assertion` (The signed JWT)

### 3. Send the Request
Send a `POST` request to the Singpass `token_endpoint`.
**Crucial**: You must include the `DPoP` header containing your generated DPoP proof.

```http
POST /token HTTP/1.1
Host: id.singpass.gov.sg
Content-Type: application/x-www-form-urlencoded
DPoP: eyJhbGci...

grant_type=authorization_code&redirect_uri=...&code=...&code_verifier=...&client_assertion_type=...&client_assertion=...
```

### 4. Handle Response
If successful, the server returns:
```json
{
  "access_token": "eyJ0eXAi...",
  "id_token": "eyJjdHki...",
  "token_type": "DPoP",
  "expires_in": 1800
}
```
Store the `access_token` for calling the UserInfo endpoint (if required). Proceed to parse and validate the `id_token`.
