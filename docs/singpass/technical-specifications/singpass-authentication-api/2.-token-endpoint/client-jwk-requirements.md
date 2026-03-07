copyCopychevron-down

1.  [Technical Specifications](/docs/technical-specifications)chevron-right
2.  [(Legacy) Pre-FAPI 2.0 API Specifications](/docs/technical-specifications/singpass-authentication-api)chevron-right
3.  [2\. Token Endpoint](/docs/technical-specifications/singpass-authentication-api/2.-token-endpoint)

# Client JWK Requirements

triangle-exclamation

All Login and Myinfo apps must follow Singpass' [FAPI 2.0-compliant authentication API](/docs/technical-specifications/integration-guide) by 31 Dec 2026.

The specifications on this page apply to you only if you are maintaining an existing Login / Myinfo (v5) integration. We encourage you to [migrate](/docs/technical-specifications/migration-guides/login-myinfo-v5-apps) early to avoid service disruptions.

Clients are expected to provide public keys to Singpass in the [JWKarrow-up-right](https://tools.ietf.org/html/rfc7517) format. These public keys will be used in the following (non-exhaustive) scenarios:

*   Signature JWK used to verify the signature of the [client assertion JWTarrow-up-right](https://docs.developer.singpass.gov.sg/docs/technical-specifications/singpass-authentication-api/2.-token-endpoint/authorization-code-grant#client-authentication-client-assertion-jwt) presented during token request.
    
*   Encryption JWK used to [encrypt an ID token](/docs/technical-specifications/singpass-authentication-api/2.-token-endpoint/authorization-code-grant) which contains the user’s PII.
    

The client must provide the public key(s) during onboarding, and they can do so only via **ONE** of the following forms:

*   Provide a JWKS in a JSON format.
    
*   Host the JWKS on a publicly accessible URL. This endpoint must be compatible with Singpass's [service level expectations](/docs/technical-specifications/singpass-authentication-api/2.-token-endpoint/client-jwk-requirements#jwks-url-service-level-expectations).
    

Signing key is always required for both `direct` and `direct_pii_allowed` clients. Encryption key is only required for `direct_pii_allowed` clients. `direct_pii_allowed` clients must ensure that the provided JWKS or the resource returned by the JWKS URL contains both the signing and encryption keys.

> TIP: [mkjwk.orgarrow-up-right](https://mkjwk.org/) is a useful open-source tool to generate different types of JWK for signing and encryption; compliant with Singpass's broad requirements on structure. While we **DO NOT** suggest this as a secure way to generate your _real_ keypair (including private key); this can be a useful tool to understand how JWK works; and how it is represented for signing and encryption purposes; while you are reviewing against our supported algorithms below.

## 

[hashtag](#jwk-for-signing)

JWK for signing

The signing JWK will be used to verify the [client assertion JWTarrow-up-right](https://docs.developer.singpass.gov.sg/docs/technical-specifications/singpass-authentication-api/2.-token-endpoint/authorization-code-grant#client-authentication-client-assertion-jwt) provided during `/token` request, thereby authenticating the client.

Clients are allowed to provide multiple signature keys in the JWKS / hosted on the JWKS url provided during client creation.

The signature JWK should have the following attributes:

*   Must have key `use` of value `sig` per [rfc7517#section-4.2arrow-up-right](https://tools.ietf.org/html/rfc7517#section-4.2)
    
*   Must contain a key ID in the standard `kid` field per [rfc7517#section-4.5arrow-up-right](https://tools.ietf.org/html/rfc7517#section-4.5)
    
    *   Will be used by Singpass to select the relevant key to verify the client assertion
        
    
*   Must be an EC key, with curves: `P-256`, `P-384` or `P-521` _(NIST curves, aka_ `_secp256r1_`_,_ `_secp384r1_`_,_ `_secp521r1_` _respectively)_
    

_Example EC signing key using P-256 and a timestamped key Id_

### 

[hashtag](#key-rotation)

**Key Rotation**

Relying parties can **rotate** their signing keys in a self-driven manner. To do this with **zero downtime** the Relying party must

*   support use of **JWKS URLs** and be onboarded as such
    
*   ensure their replacement signing key has a different key ID (`kid`) to the original key
    
*   ensure their replacement signing key matches the other cryptographic key requirements
    

To do this with zero downtime, the following procedure should be followed by the Relying Party:

Time

Action

Prep

Relying party generates a new signing key pair (`K2`) supported for signing.

T0

Relying party **adds** public key `K2` to its JWKS endpoint (and leaves `K1` on the endpoint).

T0 - T+1 hour

Singpass's cache will expire, and re-retrieves the relying party’s published keys from their JWKS endpoint which now includes `K2`.

\> T+1 hour

Relying party changes their system to start signing client assertions using the new signing key `K2`.

Clean Up

Post-validation, relying party can remove key `K1` from their JWKS endpoint when they are comfortable their new signing key is working.

## 

[hashtag](#jwk-for-encryption)

**JWK for encryption**

The encryption JWK will be used to [encrypt ID tokens](/docs/technical-specifications/singpass-authentication-api/2.-token-endpoint/authorization-code-grant) requested from the `/token` endpoint.

Singpass will select the strongest available, supported encryption key from either a **local JWKS**, or **JWKS URL** to encrypt returned ID tokens for those relying parties who require any PII in the ID token.

The encryption JWK must have the following attributes:

*   Must not contain the `d` property
    
    *   The `d` property represents the private key of your key pair, and should never be exposed. Exposure in the JWK is a critical security vulnerability.
        
    *   If you have accidentally included the `d` property in your JWK, remove it immediately and rotate your keys.
        
    
*   Must have key `use` of value `enc` per [rfc7517#section-4.2arrow-up-right](https://tools.ietf.org/html/rfc7517#section-4.2)
    
*   Must contain a key ID in the standard `kid` field per [rfc7517#section-4.5arrow-up-right](https://tools.ietf.org/html/rfc7517#section-4.5)
    
    *   The key ID will be specified in the returned JWE header so that clients can pick the right key for decryption
        
    
*   Must have key type (`kty`) of `EC`
    
*   Must specify the appropriate key encryption `alg` the relying party wants Singpass to use, consistent with the key type/curve (`kty`), and meet the requirements below on allowed `alg`/`curve`/key sizes, consistent with [RFC7518 - JSON Web Algorithm specificationarrow-up-right](https://tools.ietf.org/html/rfc7518#section-4.1)
    

Status

**Required** for new Relying Parties

Key encryption algorithm (`alg`)

ECDH-ES+A128KW ECDH-ES+A192KW ECDH-ES+A256KW

Curve (`crv`)

P-256 _(NIST, aka secp256r1)_ P-384 _(NIST, aka secp384r1)_ P-521 _(NIST, aka secp521r1)_

_Example EC encryption key using P-256 and a timestamped key Id; asking us to encrypt the CEK using ECDH-ES+A128KW_

### 

[hashtag](#key-preference)

**Key Preference**

If the relying party exposes _multiple supported encryption keys_, Singpass will select the key to use for encrypting tokens based on the following logic:

1.  prefer any EC key (`kty`) matching the above requirements
    
2.  prefer EC keys with stronger `crv` (curve) _above_ EC keys with weaker curve
    
3.  prefer EC keys with stronger `alg` key wrapping _above_ weaker ones
    
4.  otherwise pick the first compatible key we find
    

### 

[hashtag](#key-rotation-1)

**Key Rotation**

Relying parties can **rotate** their encryption keys in a self-driven manner. To do this with **zero downtime** the Relying party must

*   support use of **JWKS URLs** and be onboarded as such
    
*   have the ability to decrypt tokens produced with either **one of two** different encryption keys based on either
    
    *   selecting the correct decryption key by its key ID (`kid`)
        
    *   trial-and-error decryption against multiple keys in a collection
        
    
*   ensure their replacement key matches the other cryptographic key requirements noted above
    

To do this with zero downtime, the following procedure should be followed by the Relying Party:

Time

Action

Prep

Relying party generates a new encryption key pair (`K2`) supported for decryption. The existing key pair (`K1`) is still available for decryption of ID tokens.

T0

Relying party **removes** public key `K1` and **adds** public key `K2` on its JWKS endpoint.

T0 - T+1 hour

Singpass's caches will expire at any (indeterminate) time within this period, and start encrypting tokens with new encryption key `K2`.

T0 - T+1 hour

Relying party may be receiving tokens encrypted with either `K1` or `K2` keys throughout this period; and must be able to decrypt either.

\> T+1 hour

Relying party can remove support for decrypting with the previous `K1` key.

## 

[hashtag](#jwks-url-service-level-expectations)

JWKS URL Service Level Expectations

Singpass requires that any JWKS is published on an endpoint that

*   is served behind HTTPS on port `443` using a TLS server certificate issued by a standard _publicly verifiable CA issuer_ (no private CAs), with _complete cert chain_ presented by the server;
    
*   is publicly accessible (no IP whitelisting, mTLS or other custom HTTP header requirements outside standard HTTP headers such as `Content-Type`, `Accept`);
    
*   is able to respond in a timely fashion with respect to the below configuration.
    

Per try timeout

3s

Max attempts

3

Cache duration for retrieved JWKS

1h

> Note: While the above is a technical requirement; the user experience of your users may be affected if we are unable to retrieve your JWKS in a timely fashion upon our cache expiry due to slower token exchanges with your backend. We recommend aiming for this response to be as fast as possible based on an in-memory cache; or simple static asset retrieval.

If Singpass fails to retrieve a valid JWKS from the provided URL after cache expiry, the relying party’s token exchange will fail with an OAuth2/OIDC `invalid_client` error in these circumstances:

*   if _client assertions_ are used, and we are unable to validate the relying party’s assertion using their signing key
    
*   if _encryption of returned ID tokens_ is required, and we are unable to retrieve the relying party’s preferred encryption key
    

[PreviousAuthorization Code Grantchevron-left](/docs/technical-specifications/singpass-authentication-api/2.-token-endpoint/authorization-code-grant)[Next3\. Userinfo Endpointchevron-right](/docs/technical-specifications/singpass-authentication-api/3.-userinfo-endpoint)

Last updated 24 days ago

Was this helpful?