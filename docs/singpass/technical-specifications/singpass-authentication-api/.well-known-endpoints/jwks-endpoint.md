copyCopychevron-down

1.  [Technical Specifications](/docs/technical-specifications)chevron-right
2.  [(Legacy) Pre-FAPI 2.0 API Specifications](/docs/technical-specifications/singpass-authentication-api)chevron-right
3.  [.well-known Endpoints](/docs/technical-specifications/singpass-authentication-api/.well-known-endpoints)

# JWKS Endpoint

triangle-exclamation

All Login and Myinfo apps must follow Singpass' [FAPI 2.0-compliant authentication API](/docs/technical-specifications/integration-guide) by 31 Dec 2026.

The specifications on this page apply to you only if you are maintaining an existing Login / Myinfo (v5) integration. We encourage you to [migrate](/docs/technical-specifications/migration-guides/login-myinfo-v5-apps) early to avoid service disruptions.

Singpass signs all JWTs issued during the authentication process using its ASP signing key. Integrating parties can validate the JWT signatures by acquiring the signing public key from a **JSON Web Key Set (JWKS)** endpoint.

This endpoint will return one or more public keys in [JSON Web Key (JWK)arrow-up-right](https://tools.ietf.org/html/rfc7517) form. The correct JWK to use for signature validation will have its `use` attribute as `sig` (to indicate that it is a signing key), and its `kid` value should match the one found in the JWT under validation.

Public keys returned from this endpoint could be in random sequence or rotated for security enhancement. For more information, please refer to [Caching and key rotation](/docs/technical-specifications/singpass-authentication-api/.well-known-endpoints/jwks-endpoint#caching-and-key-rotation) section.

## 

[hashtag](#curl-request)

Curl request

Copy

```
$ curl 'https://stg-id.singpass.gov.sg/.well-known/keys' -i -X GET \
    -H 'Accept: application/json'
```

## 

[hashtag](#http-request)

HTTP request

Copy

```
GET /.well-known/keys HTTP/1.1
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
Content-Type: application/json
Content-Length: 697

{
  "keys" : [ {
    "kty" : "EC",
    "use" : "sig",
    "crv" : "P-256",
    "kid" : "eckey-test-secondary",
    "x" : "9bRoLZyZeV49dMVYauCapuZJ7g8ae8e0vWERXr77OT8",
    "y" : "o6lIAyvlmjV7qkGLlLkPIoKHc9VQxSXWgZ-xnboPuuU"
  }, {
    "kty" : "EC",
    "use" : "sig",
    "crv" : "P-256",
    "kid" : "eckey-test",
    "x" : "MW_NF3jr-Fjn8RMg7_ewHfc4VBNJJUnn_gGht3Y-Aeo",
    "y" : "hqdPsdwc8FHpPl47VInEgK2F3and2P_0AnR2q92o4M0"
  }, {
    "kty" : "EC",
    "use" : "sig",
    "crv" : "P-256",
    "kid" : "alias/test-sp-auth-api-id-token-signing-key-kms-asymmetric-key-alias",
    "x" : "wit9gl-WpjLzgpNmpf4RP8UHLDHzqq1HHhQPmGCALdY",
    "y" : "oFVT90ZGZdkw8Ok-G9MvsE1SUhh1N0I78LFrprrIHx8"
  } ]
}
```

## 

[hashtag](#httpie-request)

HTTPie request

## 

[hashtag](#request-body)

Request body

## 

[hashtag](#response-body)

Response body

## 

[hashtag](#caching-and-key-rotation)

Caching and key rotation

> IMPORTANT: Responses from this endpoint, or individual keys from inside the JWKS can and should be cached for at least 1 hour, and NOT retrieved for each JWT validation. Cache-Control headers on the response indicate a possible policy.

For varying reasons, keys used for signing can and will be rotated/changed with no defined schedule, and at the full discretion of NDI. When a key rotation happens, the new key will be available from the JWKS endpoint and will have a different `kid` value. The new `kid` value will be reflected in all the new JWTs signed by NDI. In such cases, cached copies of NDI public keys must be refreshed by re-invoking the JWKS endpoint.

If the validation of the NDI signature fails, re-fetch from the JWKS endpoint once for that validation.

Please read through the list of **DON’Ts** below:

*   Do not assume the position of a signing key among the list of the returned keys.
    
*   Do not validate NDI signatures using a hardcoded public key OR `kid`. Always determine the correct key (for signature verification) by inspecting the `kid` from the JWS header, and use it to retrieve the public key from our JWKS endpoint.
    
*   Do not cache only 1 key. Caching should be done for the entire JWKS.
    

[PreviousOpenID Discovery Endpointchevron-left](/docs/technical-specifications/singpass-authentication-api/.well-known-endpoints/openid-discovery-endpoint)[NextError Responsechevron-right](/docs/technical-specifications/singpass-authentication-api/error-response)

Last updated 24 days ago

Was this helpful?