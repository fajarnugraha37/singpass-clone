# Client Implementation: UserInfo Request

## Overview
If you are integrating with Myinfo or requested additional scopes that are not returned in the `id_token`, you must query the `userinfo_endpoint` using the `access_token` obtained from the Token Exchange.

## Steps to Execute

### 1. Prepare DPoP Proof
Generate a new DPoP JWT signed by your DPoP key pair.
- Set `htm` to `GET`.
- Set `htu` to the URL of the `userinfo_endpoint`.
- Set `jti` to a unique identifier.

### 2. Send the Request
Send a `GET` request to the Singpass `userinfo_endpoint`.
- Set the `Authorization` header to `DPoP <access_token>`.
- Set the `DPoP` header to your newly generated DPoP proof.

```http
GET /userinfo HTTP/1.1
Host: id.singpass.gov.sg
Authorization: DPoP eyJ0eXAi...
DPoP: eyJhbGci...
```

### 3. Handle the Response
If successful, Singpass returns the payload wrapped in the same JWE/JWS format as the `id_token`.

1. **Decrypt**: Use your client's Private Encryption Key to decrypt the JWE.
2. **Verify Signature**: Use the Singpass public key from the JWKS endpoint to verify the JWS signature.
3. **Validate**: Ensure `iss`, `sub`, and `aud` match expected values.
4. **Extract Data**: Extract the `person_info` object, which contains the detailed demographic, financial, or personal data corresponding to the requested scopes.
