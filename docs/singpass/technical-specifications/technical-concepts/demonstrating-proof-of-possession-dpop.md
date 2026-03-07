copyCopychevron-down

1.  [Technical Specifications](/docs/technical-specifications)chevron-right
2.  [Technical Concepts](/docs/technical-specifications/technical-concepts)

# Demonstrating Proof of Possession (DPoP)

## 

[hashtag](#overview)

Overview

DPoP ([RFC 9449arrow-up-right](https://www.rfc-editor.org/rfc/rfc9449.html)) protects your integration from:

1.  Authorization code inteception
    
2.  Access token misuse or leakage
    

It works by binding the _authorization code_ and _access token_ to a private key that only your system controls. allowing only you to use them for [Token Exchange](/docs/technical-specifications/integration-guide/3.-token-exchange) and [Requesting For Userinfo](/docs/technical-specifications/integration-guide/5.-requesting-for-userinfo) respectively.

#### 

[hashtag](#when-is-dpop-required)

**When is DPoP Required?**

You must include a **DPoP proof JWT** in the DPoP request header for the following API calls:

*   [Pushed Authorization Request](/docs/technical-specifications/integration-guide/1.-authorization-request#id-1.-sending-the-pushed-authorization-request)
    
*   [Token Exchange](/docs/technical-specifications/integration-guide/3.-token-exchange)
    
*   [Requesting for Userinfo](/docs/technical-specifications/integration-guide/5.-requesting-for-userinfo)
    

If DPoP is missing or invalid the request will be rejected

#### 

[hashtag](#key-requirements)

**Key Requirements**

circle-exclamation

You **must** use the same DPoP key pair across all three requests for a single authentication. You should generate a different ephemeral key for each authentication.

*   Generate a **new** ephemeral DPoP key pair for each authentication session
    
*   Use the **same key pair across all three requests** (PAR → Token → Userinfo) for that session
    
*   Do not reuse the key pair across different login sessions
    

#### 

[hashtag](#what-is-the-dpop-proof-jwt)

What Is the DPoP Proof JWT?

The DPoP Proof JWT is a signed JWT (JWS) that proves you own the private key bound to the token — without exposing the private key.

To implement:

*   We recommend using a standard JWT library
    
*   You may refer to [this listarrow-up-right](https://www.jwt.io/libraries?support=sign&algorithm=es256) to look for a suitable library for your programming language. To learn more about JWTs and their structure, you may read [this articlearrow-up-right](https://www.jwt.io/introduction).
    

### 

[hashtag](#dpop-proof-jwt-structure-and-requirements)

DPoP Proof JWT Structure and Requirements

#### 

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

Must be the string `dpop+jwt`

`jwk`

The public key, in JSON Web Key format, that corresponds to the private key used to sign the JWT

Object in JSON Web Key format

chevron-rightSample JWT header[hashtag](#sample-jwt-header)

#### 

[hashtag](#jwt-payload)

JWT Payload

The JWT payload should contain the following claims:

Claim

Description

Data type

`htm`

The HTTP method of the request that you are making

Either the string `POST` or `GET`

`htu`

The URL that you are making the request to.

URL

`iat`

The unix timestamp, in seconds, at which you generated this JWT.

This value must be a [`NumericDate`arrow-up-right](https://datatracker.ietf.org/doc/html/rfc7519#section-2) type, representing seconds.

`exp`

The unix timestamp, in seconds, on or after which this JWT **must not** be accepted by us for processing. Note also that this must be less than or equal to 2 minutes after `iat`.

This value must be a [`NumericDate`arrow-up-right](https://datatracker.ietf.org/doc/html/rfc7519#section-2) type, representing seconds.

`jti`

A unique identifier for this token. This identifier must only be used once. You should generate a new `jti` value for every request

String

`ath`

Required only for the userinfo request. This should be the base64url-encoded SHA-256 hash of the access token.

A base64url-encoded string.

chevron-rightSample JWT payload[hashtag](#sample-jwt-payload)

### 

[hashtag](#signing-and-using-the-jwt)

Signing and using the JWT

The JWT should be signed using your private DPoP key to form a JSON Web Signature (JWS) in compact serialisation format. This is a format where the three parts of the JWS (the header, the payload, and the signature), are base64url encoded and concatenated together, using a dot (`.`) as the separator.

The private key used to sign the JWT must correspond to the public key indicated in the `jwk` parameter in the JWT header.

This JWS should then be included in the `DPoP` request header when you are making requests that require DPoP.

### 

[hashtag](#validate-your-dpop-implementation)

Validate Your DPoP Implementation

you can validate your DPoP proof JWT using this online validator tool:

[DPoP & Client Assertion Validatorarrow-up-right](https://client-assertion-dpop-validator.vercel.app/)

This tool helps you:

*   Verify JWT structure and compact format
    
*   Check required header parameters (alg, typ, jwk)
    
*   Validate required payload claims
    
*   Confirm signature validity
    
*   Detect common implementation errors
    

[PreviousProof Key for Code Exchange (PKCE)chevron-left](/docs/technical-specifications/technical-concepts/proof-key-for-code-exchange-pkce)[NextOpenID Provider Configurationchevron-right](/docs/technical-specifications/technical-concepts/openid-connect-discovery)

Last updated 11 days ago

Was this helpful?