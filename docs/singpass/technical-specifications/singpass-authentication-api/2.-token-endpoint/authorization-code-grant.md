copyCopychevron-down

1.  [Technical Specifications](/docs/technical-specifications)chevron-right
2.  [(Legacy) Pre-FAPI 2.0 API Specifications](/docs/technical-specifications/singpass-authentication-api)chevron-right
3.  [2\. Token Endpoint](/docs/technical-specifications/singpass-authentication-api/2.-token-endpoint)

# Authorization Code Grant

triangle-exclamation

All Login and Myinfo apps must follow Singpass' [FAPI 2.0-compliant authentication API](/docs/technical-specifications/integration-guide) by 31 Dec 2026.

The specifications on this page apply to you only if you are maintaining an existing Login / Myinfo (v5) integration. We encourage you to [migrate](/docs/technical-specifications/migration-guides/login-myinfo-v5-apps) early to avoid service disruptions.

## 

[hashtag](#client-authentication-client-assertion-jwt)

Client Authentication - Client Assertion JWT

### 

[hashtag](#assertion-jwt-structure)

Assertion JWT Structure

The RP is required to generate an assertion JWT that has the following header and claims, and is signed with the JWK that was provided during onboarding.

#### 

[hashtag](#jwt-header)

**JWT Header**

The header **must include** `**alg**` **and** `**typ**`.

The supported `alg` types are:

*   `ES256`
    
*   `ES384`
    
*   `ES512`.
    

This must match the `alg` value in the signing key used to sign the assertion (if the signing JWK specifies `alg` explicitly).

The header should also include `kid` of the signing key to help identify which of the RP’s signing keys was used, though this is not mandatory. If omitted, we will test against all known signing keys when attempting to verify the signature.

_example_

Copy

```
{
  "typ": "JWT",
  "alg": "ES256",
  "kid": "rp_key_01"
}
```

#### 

[hashtag](#jwt-claims)

**JWT Claims**

Path

Type

Description

`sub`

`String`

This should be `client_id` of the registered client.

`aud`

`String`

The recipient that the JWT is intended for. This must match the `issuer` field in the response of the OpenID discovery endpoint ([https://id.singpass.gov.sg/.well-known/openid-configurationarrow-up-right](https://id.singpass.gov.sg/.well-known/openid-configuration)) e.g. [https://id.singpass.gov.sgarrow-up-right](https://id.singpass.gov.sg/).

`iss`

`String`

This should be `client_id` of the registered client.

`iat`

`Number`

The time at which the JWT was issued. [https://tools.ietf.org/html/rfc7519#section-4.1.6arrow-up-right](https://tools.ietf.org/html/rfc7519#section-4.1.6)

`exp`

`Number`

The expiration time on or after which the JWT MUST NOT be accepted by Singpass for processing. Additionally, Singpass will not accept tokens with an `exp` longer than 2 minutes since `iat`. [https://tools.ietf.org/html/rfc7519#section-4.1.4arrow-up-right](https://tools.ietf.org/html/rfc7519#section-4.1.4)

`jti`

`String`

A unique identifier for this token. This identifier must only be used once. You should generate a new `jti` value for every request.

`code`

`String`

(Optional) This should be the auth `code` which is used to exchange for an ID token. It should be identical to the `code` form param sent outside the `client_assertion`. This enables increased security by signing the `code` so that the `client_assertion` can only be used once for a specific request.

### 

[hashtag](#request-response-structure)

Request / Response Structure

Curl request

#### 

[hashtag](#form-parameters)

Form parameters

Parameter

Description

`client_id`

The Client Identifier registered. It is the App ID found at the top of your app configuration page.

`redirect_uri`

The redirect URI being used in this auth session.

`grant_type`

The type of grant being requested. This must be set to `authorization_code`.

`code`

The code issued earlier in the auth session.

`scope`

(Optional) If no value is provided, it defaults to `openid`. If provided, then only `openid` is allowed.

`client_assertion_type`

This MUST be set to `urn:ietf:params:oauth:client-assertion-type:jwt-bearer`.

`client_assertion`

A JWT identifying the client.

`code_verifier`

(Mandatory) This is the session-based, unique, and non-guessable value that the RP had used to generate the `code_challenge`.

Must match `regexp` pattern of `[a-zA-Z0-9_\-.~]+` minimum length of 43 characters and a maximum length of 128 characters.

#### 

[hashtag](#http-request)

HTTP request

#### 

[hashtag](#http-response)

HTTP response

#### 

[hashtag](#request-body)

Request body

#### 

[hashtag](#response-body)

Response body

#### 

[hashtag](#response-fields)

Response fields

Path

Type

Description

`access_token`

`String`

For Login flows, the access token will be a random string that is not to be used. For Myinfo flows, the token will be an encoded JSON Web Token (JWT). This token is to be used to exchange for payload at UserInfo Endpoint.

`token_type`

`String`

The type of token being requested, Bearer only so far.

`id_token`

`String`

The ID token with relevant claims in JWT format signed by the ASP. Note that the example response body shows a JWS (3-part structure separated by dots), but the format will differ for a JWS in JWE (5-part structure). Refer [here](/docs/technical-specifications/singpass-authentication-api/2.-token-endpoint/authorization-code-grant#id-token-structure) for more details about the ID token structure.

### 

[hashtag](#error-response)

**Error Response**

Singpass generally follows OIDC error response specifications. For more information, please refer to [Token Error Response specificationsarrow-up-right](https://tools.ietf.org/html/rfc6749#section-5.2).

## 

[hashtag](#id-token-structure)

ID Token Structure

The format and structure of the issued ID Token will vary depending on the client’s profile as specified in this table below:

Client Profile

`sub` Claim Content

ID token format

`direct`

UUID only (eg. `u=32af8b7d-ad1d-4c25-8dc7-0a981b533000`)

JWS

`direct_pii_allowed`

**Regular NRIC holders**: NRIC and UUID (eg. `s=S1234567A,u=32af8b7d-ad1d-4c25-8dc7-0a981b533000`)

**Singpass Foreign Account (SFA) holders**: Singpass User ID (UID), Foreigner ID (FID), Country-of-Issuance (COI) and UUID (eg. `s=Y7613265T,fid=G730Z-H5P96,coi=DE,u=e2af740e-25b4-4b19-b527-494670952cb0`)

This class of users were previously known as "Foreign Unique Account" or "Singpass Foreign Unique Account" users. Only designated relying parties are able to have SFA users authenticate & complete token exchange.

JWS in JWE (encrypted with client’s JWK)

See section below for more details about the JWE format.

`bridge` (special case internal use only)

NRIC and UUID (eg. `s=S1234567A,u=32af8b7d-ad1d-4c25-8dc7-0a981b533000`)

JWS

### 

[hashtag](#overview-of-a-jws-in-jwe)

Overview of a JWS in JWE

An encrypted ID token will returned from the `/token` endpoint is a JWS in JWE that is in compact serialization form. It has the following structure:

*   JWE Header
    
*   Encrypted Key
    
*   Initialization Vector
    
*   Encrypted Payload (if decrypted, this would be the Base64 encoded form of a [JWS ID Token](/docs/technical-specifications/singpass-authentication-api/2.-token-endpoint/authorization-code-grant#overview-of-jws))
    
*   Authentication Tag
    

See [https://datatracker.ietf.org/doc/html/rfc7516#section-3.1arrow-up-right](https://datatracker.ietf.org/doc/html/rfc7516#section-3.1) for more details.

### 

[hashtag](#jwe-header)

JWE Header

The JWE will contain these standard headers. Refer to [https://tools.ietf.org/html/rfc7515#section-4arrow-up-right](https://tools.ietf.org/html/rfc7515#section-4) for more information about each header.

> Note: Relying parties should use the `kid` field in the header to determine which key NDI used for encryption.

_example_

### 

[hashtag](#overview-of-jws)

Overview of JWS

The [JWSarrow-up-right](https://tools.ietf.org/html/rfc7515) ID token returned from the `/token` endpoint is in compact serialization form. A JWS has the following structure.

*   JWS Header
    
*   Payload (containing claims)
    
*   Signature
    

### 

[hashtag](#jws-header)

JWS Header

The JWS ID token will contain these standard headers. Refer to [https://tools.ietf.org/html/rfc7515#section-4arrow-up-right](https://tools.ietf.org/html/rfc7515#section-4) for more information about each header.

_example_

### 

[hashtag](#jws-claims)

JWS Claims

The JWS ID token will contain the following claims.

_example_

_Table 1. Description of Claims_

Path

Type

Description

`sub`

`String`

The principal that is the subject of the JWT. Contains a comma-separated, key=value mapping that identifies the user; possibly including multiple alternate IDs representing the user. The keys included vary by the profile of the OIDC client, and the user type, however the minimal format is `u=<UUID>` where UUID represents the user’s globally unique identifier. [https://tools.ietf.org/html/rfc7519#section-4.1.2arrow-up-right](https://tools.ietf.org/html/rfc7519#section-4.1.2)

`aud`

`String`

The client\_id of the relying party. [https://tools.ietf.org/html/rfc7519#section-4.1.3arrow-up-right](https://tools.ietf.org/html/rfc7519#section-4.1.3)

`iss`

`String`

The principal that issued the JWT. [https://tools.ietf.org/html/rfc7519#section-4.1.1arrow-up-right](https://tools.ietf.org/html/rfc7519#section-4.1.1)

`iat`

`Number`

The time at which the JWT was issued. [https://tools.ietf.org/html/rfc7519#section-4.1.6arrow-up-right](https://tools.ietf.org/html/rfc7519#section-4.1.6)

`exp`

`Number`

The expiration time on or after which the JWT MUST NOT be accepted for processing. Defaults to 10 minutes since "iat". [https://tools.ietf.org/html/rfc7519#section-4.1.4arrow-up-right](https://tools.ietf.org/html/rfc7519#section-4.1.4)

`amr`

`Array`

Authentication method references. Example values are `["face"]`, `["fv"]`, `["fv-alt"]`, `["otp"]`, `["pwd","fv"]`, `["pwd","otp-email"]`, `["pwd","sms"]`, `["pwd","swk"]`, `["pwd"]`, `["sso"]`. Note that this list is non-exhaustive, and NDI reserves the right to introduce new values without prior notice to RPs.

`nonce`

`String`

String value used to associate a Client session with an ID Token, and to mitigate replay attacks. The value is passed through unmodified from the Authentication Request to the ID Token. Clients MUST verify that the nonce Claim Value is equal to the value of the nonce parameter sent in the Authentication Request. [https://openid.net/specs/openid-connect-core-1\_0.html#IDTokenarrow-up-right](https://openid.net/specs/openid-connect-core-1_0.html#IDToken)

`acr`

`String`

(Optional) The Authentication Context Class Reference. The values are context-specific and agreed upon between NDI and relying parties when used.

[Previous2\. Token Endpointchevron-left](/docs/technical-specifications/singpass-authentication-api/2.-token-endpoint)[NextClient JWK Requirementschevron-right](/docs/technical-specifications/singpass-authentication-api/2.-token-endpoint/client-jwk-requirements)

Last updated 24 days ago

Was this helpful?