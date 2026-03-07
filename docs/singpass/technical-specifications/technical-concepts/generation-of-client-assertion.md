copyCopychevron-down

1.  [Technical Specifications](/docs/technical-specifications)chevron-right
2.  [Technical Concepts](/docs/technical-specifications/technical-concepts)

# Generation Of Client Assertion

circle-info

If you are using a [certified OIDC Relying Party libraryarrow-up-right](https://openid.net/developers/certified-openid-connect-implementations/), the generation of client assertion will be handled by the library, as long as you specify that the `private_key_jwt` method is used for authentication.

## 

[hashtag](#overview)

Overview

When your backend calls our APIs, you will need to generate a client assertion to authenticate yourself. The generation of this client assertion should be done using the `private_key_jwt` mechanism specified in the [OIDC specificationsarrow-up-right](https://openid.net/specs/openid-connect-core-1_0-final.html#ClientAuthentication). This mechanism involves you building a client assertion by signing a JWT using one of your signing keys defined in your [JWKS](/docs/technical-specifications/technical-concepts/json-web-key-sets-jwks).

Client assertions need to be sent in the [Pushed Authorization Request](/docs/technical-specifications/integration-guide/1.-authorization-request#id-1.-sending-the-pushed-authorization-request) and the [Token Request](/docs/technical-specifications/integration-guide/3.-token-exchange).

## 

[hashtag](#generation-of-jwt)

Generation of JWT

To reduce complexity, we recommend that you use a JWT library to perform the JWT encoding and signing on your behalf, instead of implementing this on your own. You may refer to [this listarrow-up-right](https://www.jwt.io/libraries?support=sign&algorithm=es256) to look for a suitable library for your programming language. To learn more about JWTs and their structure, you may read [this articlearrow-up-right](https://www.jwt.io/introduction).

The JWT must have the structure outlined below.

### 

[hashtag](#jwt-header)

JWT Header

The JWT header should contain the following parameters:

Parameter

Description

Data Type

`alg`

The signature algorithm that you are using to sign this JWT

One of the following strings:

*   `ES256`
    
*   `ES384`
    
*   `ES512`
    

`typ`

The type of this JWT

Must be the string `JWT`

`kid`

The `kid` of the signing key that you are using to sign this JWT header. If this is not provided, we will test against all of the signing keys in your JWKS when attempting to verify the signature.

String, optional

chevron-rightSample JWT header in JSON form[hashtag](#sample-jwt-header-in-json-form)

Copy

```
{
  "typ": "JWT",
  "alg": "ES256",
  "kid": "my_key_id_01"
}
```

### 

[hashtag](#jwt-payload)

JWT Payload

The JWT payload should contain the following claims:

Claim

Description

Data type

`sub`

The client ID of your registered client, provided by Singpass during app onboarding.

A 32-character case-sensitive alphanumeric string.

`aud`

This should be the issuer identifier of our authorization server. You can obtain this value from the `issuer` field in the OpenID configuration of our authorization server.

String

`iss`

The client ID of your registered client, provided by Singpass during app onboarding.

A 32-character case-sensitive alphanumeric string.

`iat`

The unix timestamp, in seconds, at which you generated this JWT.

Number

`exp`

The unix timestamp, in seconds, on or after which this JWT **must not** be accepted by us for processing. Note also that this must be less than or equal to 2 minutes after `iat`.

Number

`jti`

A unique identifier for this token. This identifier must only be used once. You should generate a new `jti` value for every request

String

chevron-rightSample JWT Payload in JSON form[hashtag](#sample-jwt-payload-in-json-form)

### 

[hashtag](#overall-jwt-signed-and-encoded)

Overall JWT (Signed and Encoded)

The JWT should be signed using your private key to form a JSON Web Signature (JWS) in compact serialisation format. This is a format where the three parts of the JWS (the header, the payload, and the signature), are base64url encoded and concatenated together, using a dot (`.`) as the separator.

You must publish the public key corresponding to the private key you used to sign this JWT in your [JWKS](/docs/technical-specifications/technical-concepts/json-web-key-sets-jwks).

chevron-rightSample Signed JWT (in Compact Serialisation Format)[hashtag](#sample-signed-jwt-in-compact-serialisation-format)

[PreviousJSON Web Key Sets (JWKS)chevron-left](/docs/technical-specifications/technical-concepts/json-web-key-sets-jwks)[NextProof Key for Code Exchange (PKCE)chevron-right](/docs/technical-specifications/technical-concepts/proof-key-for-code-exchange-pkce)

Last updated 25 days ago

Was this helpful?