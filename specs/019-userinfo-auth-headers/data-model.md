# Data Model: UserInfo Authentication Headers

## Entities

### AccessTokenData (Existing)
*What it represents:* Data associated with an issued access token.

- **id**: string (Access Token value)
- **userId**: string (User associated with the token)
- **clientId**: string (Client that requested the token)
- **scope**: string (Authorized scopes)
- **expiresAt**: Date (When the token expires)
- **dpopJkt**: string (DPoP Proof Thumbprint binding)

## Relationships
- **AccessTokenData** is used to validate the incoming `Authorization` header on the UserInfo endpoint.
- If the token is not found or is expired, it triggers a 401 response with the `WWW-Authenticate` header.
- The `dpopJkt` field is used to validate the DPoP binding; if mismatching or missing, it triggers an `invalid_dpop_proof` error challenge in the header.
