copyCopychevron-down

1.  [Technical Specifications](/docs/technical-specifications)chevron-right
2.  [(Legacy) Pre-FAPI 2.0 API Specifications](/docs/technical-specifications/singpass-authentication-api)chevron-right
3.  [.well-known Endpoints](/docs/technical-specifications/singpass-authentication-api/.well-known-endpoints)

# OpenID Discovery Endpoint

triangle-exclamation

All Login and Myinfo apps must follow Singpass' [FAPI 2.0-compliant authentication API](/docs/technical-specifications/integration-guide) by 31 Dec 2026.

The specifications on this page apply to you only if you are maintaining an existing Login / Myinfo (v5) integration. We encourage you to [migrate](/docs/technical-specifications/migration-guides/login-myinfo-v5-apps) early to avoid service disruptions.

Responses from this endpoint can and should be cached for at least 1 hour, and NOT retrieved for each OIDC/Auth2 operation. Cache-Control headers on the response indicate a possible policy.

circle-info

If you are using an off-the-shelf OIDC client to integrate with Singpass, you will probably only need to specify our Issuer URL.

OIDC Discovery URLs in general may be derived by concatenating the string `/.well-known/openid-configuration` to the Issuer URL.

## 

[hashtag](#curl-request)

Curl request

Copy

```
$ curl 'https://stg-id.singpass.gov.sg/.well-known/openid-configuration' -i -X GET \
    -H 'Accept: application/json'
```

## 

[hashtag](#http-request)

HTTP request

Copy

```
GET /.well-known/openid-configuration HTTP/1.1
Accept: application/json
Host: stg-id.singpass.gov.sg
```

## 

[hashtag](#http-response)

HTTP response

Copy

```
HTTP/1.1 200 OK
Cache-Control: max-age=21600, must-revalidate, no-transform, public
X-XSS-Protection: 0
X-Frame-Options: DENY
Date: Thu, 26 Sep 2024 03:38:09 GMT
Connection: keep-alive
Vary: Origin
Vary: Access-Control-Request-Method
Vary: Access-Control-Request-Headers
X-Content-Type-Options: nosniff
Transfer-Encoding: chunked
Content-Type: application/json
Content-Length: 1125

{
  "issuer" : "https://stg-id.singpass.gov.sg",
  "authorization_endpoint" : "https://stg-id.singpass.gov.sg/auth",
  "jwks_uri" : "https://stg-id.singpass.gov.sg/.well-known/keys",
  "response_types_supported" : [ "code" ],
  "scopes_supported" : [ "openid" ],
  "subject_types_supported" : [ "public" ],
  "claims_supported" : [ "nonce", "aud", "iss", "sub", "exp", "iat" ],
  "grant_types_supported" : [ "authorization_code", "urn:openid:params:grant-type:ciba" ],
  "token_endpoint" : "https://stg-id.singpass.gov.sg/token",
  "token_endpoint_auth_methods_supported" : [ "private_key_jwt" ],
  "token_endpoint_auth_signing_alg_values_supported" : [ "ES256", "ES384", "ES512" ],
  "id_token_signing_alg_values_supported" : [ "ES256" ],
  "id_token_encryption_alg_values_supported" : [ "ECDH-ES+A256KW", "ECDH-ES+A192KW", "ECDH-ES+A128KW" ],
  "id_token_encryption_enc_values_supported" : [ "A256CBC-HS512" ],
  "backchannel_authentication_endpoint" : "https://stg-id.singpass.gov.sg/bc-auth",
  "backchannel_token_delivery_modes_supported" : [ "poll" ],
  "userinfo_endpoint" : "https://stg-id.singpass.gov.sg/userinfo"
}
```

## 

[hashtag](#httpie-request)

**HTTPie request**

## 

[hashtag](#request-body)

Request body

## 

[hashtag](#response-body)

Response body

## 

[hashtag](#response-fields)

Response fields

Path

Type

Description

`issuer`

`String`

URL (identity) of the issuer.

`authorization_endpoint`

`String`

URL of the OP’s OAuth 2.0 Authorization Endpoint.

`jwks_uri`

`String`

URL of the OP’s JSON Web Key Set.

`response_types_supported`

`Array`

JSON array containing a list of the OAuth 2.0 response\_type values that OP supports.

`scopes_supported`

`Array`

JSON array containing a list of the OAuth 2.0 scope values that OP supports.

`subject_types_supported`

`Array`

JSON array containing a list of the Subject Identifier types that this OP supports.

`claims_supported`

`Array`

JSON array containing a list of the Claim Names of the Claims that the OpenID Provider MAY be able to supply values for.

`grant_types_supported`

`Array`

JSON array containing a list of the OAuth 2.0 Grant Type values that this OP supports.

`token_endpoint`

`String`

URL of the OP’s OAuth 2.0 Token Endpoint. This contains the signing key(s) the RP uses to validate signatures from the OP.

`token_endpoint_auth_methods_supported`

`Array`

JSON array containing a list of Client Authentication methods supported by this Token Endpoint.

`token_endpoint_auth_signing_alg_values_supported`

`Array`

JSON array containing a list of the JWS signing algorithms (alg values) supported by the Token Endpoint for the signature on the JWT used to authenticate the Client at the Token Endpoint for the private\_key\_jwt authentication methods.

`id_token_signing_alg_values_supported`

`Array`

JSON array containing a list of the JWS signing algorithms (alg values) supported bythe OP for the ID Token to encode the Claims in a JWT.

`id_token_encryption_alg_values_supported`

`Array`

JSON array containing a list of the JWE encryption algorithms (alg values) supportedby the OP for the ID Token to encode the Claims in a JWT.

`id_token_encryption_enc_values_supported`

`Array`

JSON array containing a list of the JWE encryption algorithms (enc values) supportedby the OP for the ID Token to encode the Claims in a JWT.

`backchannel_token_delivery_modes_supported`

`Array`

JSON array containing supported backchannel delivery modes.

`backchannel_authentication_endpoint`

`String`

URL of the OP’s Backchannel Authentication Endpoint.

`userinfo_endpoint`

`String`

URL of the OP’s UserInfo Endpoint.

[Previous.well-known Endpointschevron-left](/docs/technical-specifications/singpass-authentication-api/.well-known-endpoints)[NextJWKS Endpointchevron-right](/docs/technical-specifications/singpass-authentication-api/.well-known-endpoints/jwks-endpoint)

Last updated 24 days ago

Was this helpful?