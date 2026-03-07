copyCopychevron-down

1.  [Technical Specifications](/docs/technical-specifications)chevron-right
2.  [Technical Concepts](/docs/technical-specifications/technical-concepts)

# JSON Web Key Sets (JWKS)

## 

[hashtag](#overview)

Overview

A JSON Web Key Set (JWKS) is a set of keys that contain a list of cryptographic keys that can be used either for signature verification or for encryption. Each key in the JWKS is stored in the JSON Web Key format, as specified in [RFC 7517arrow-up-right](https://datatracker.ietf.org/doc/html/rfc7517).

In order to integrate with Singpass, you are required to [register](/docs/technical-specifications/technical-concepts/json-web-key-sets-jwks#registration-of-jwks) your JWKS with us. The same JWKS can be reused across multiple Singpass integrations.

Conversely, we also broadcast our JWKS at [https://id.singpass.gov.sg/.well-known/keysarrow-up-right](https://id.singpass.gov.sg/.well-known/keys). These are our public keys used for signing, and you should use them to verify the signature in both the ID token and the Userinfo response.

chevron-rightExample JWKS[hashtag](#example-jwks)

Copy

```
{
  "keys": [
    {
      "kty": "EC",
      "alg": "ES256",
      "use": "sig",
      "kid": "ydGFKJbIoqzSJyMpUiprLpaQz7RxV8C_HLiCW-l0q1k",
      "crv": "P-256",
      "x": "vx_9JwRUaXaj8nE21-mgtjrx2JPkOM_iawIIbIV2huc",
      "y": "ZvqP1ErOvOmMvaaWVA2WzB6eroYsz4I1PML1AiEIvsQ"
    },
    {
      "kty": "EC",
      "alg": "ECDH-ES+A256KW",
      "use": "enc",
      "kid": "R-G-GcB8vBaBCdQENkLD5k8MJnLQG4a1TR1Fx94CUvM",
      "crv": "P-256",
      "x": "fr9yjpnKygf6ZwR0L9kVIGES-B4CqQUo8_X_PyF725s",
      "y": "5iaXtCMTRXZzA-RwAHji0KUi_5XrrzeIGDuOoDNdPxo"
    }
  ]
}
```

## 

[hashtag](#purpose-of-jwks)

Purpose of JWKS

The keys that you provide in your JWKS will be used for the following:

*   Verification of your [client assertions](/docs/technical-specifications/technical-concepts/generation-of-client-assertion) (they are signed by one of your private keys). This is done during both the [Pushed Authorization Request](/docs/technical-specifications/integration-guide/1.-authorization-request#id-1.-sending-the-pushed-authorization-request) and [Token Exchange](/docs/technical-specifications/integration-guide/3.-token-exchange)
    
*   Encryption of the [ID Token](/docs/technical-specifications/integration-guide/4.-parsing-the-id-token)
    
*   Encryption of the [Userinfo response](/docs/technical-specifications/integration-guide/5.-requesting-for-userinfo#response)
    

## 

[hashtag](#registration-of-jwks)

Registration of JWKS

When registering your JWKS with us, you have two options:

1.  Directly register the JWKS with us as a JSON object in your app configuration
    
2.  Host the JWKS on a publicly accessible URL, and register that URL with us in your app configuration.
    

## 

[hashtag](#requirements-for-jwks)

Requirements for JWKS

### 

[hashtag](#general)

General

1.  Your JWKS must have at least one encryption key and one signing key.
    
2.  All of the keys in your JWKS must **not** expose your private key. Specifically, it must **not** contain the `d` property, which represents the private key. Exposure of this property is a critical security vulnerability.
    
3.  All of the keys in the JWKS must:
    
    1.  Have unique key IDs in the `kid` field. Additionally, any new keys should not reuse previously-used key IDs.
        
    2.  Contain a `kty` of `EC`
        
    3.  Contain one of the following `crv` values:
        
        1.  `P-256`
            
        2.  `P-384`
            
        3.  `P-521`
            
        
    
4.  If your JWKS is hosted at a URL:
    
    1.  The URL **must** be publicly accessible at all times
        
    2.  It should respond as fast as possible, as the user experience of your users will be affected if your JWKS endpoint takes a long time to respond. In the worst case, it must respond within 3 seconds; otherwise, your users will fail to authenticate with us.
        
    

### 

[hashtag](#signing-keys)

Signing Keys

1.  Must have a `use` value of `sig`
    

### 

[hashtag](#encryption-keys)

Encryption Keys

1.  Must have a `use` value of `enc`
    
2.  Must contain one of the following `alg` values:
    
    1.  `ECDH-ES+A128KW`
        
    2.  `ECDH-ES+A192KW`
        
    3.  `ECDH-ES+A256KW`
        
    

## 

[hashtag](#key-rotation)

Key Rotation

You should rotate your keys at least once a year. You will be able to rotate your keys without downtime. The process for rotating encryption keys and signing keys is slightly different, and will be outlined below.

### 

[hashtag](#signing-keys-1)

Signing Keys

1.  Generate your new signing key pair, and add the public signing key to your JWKS **without** removing the old public signing key. The newly added key must have a different `kid` from any of the existing keys.
    
2.  Wait for 1 hour. This ensures that our cache has expired and that we will have fetched your new keys, which we can then use to verify requests that you sign using your new key.
    
3.  Start signing your requests using your new private key.
    
4.  Remove the old public signing key from your JWKS.
    

### 

[hashtag](#encryption-keys-1)

Encryption Keys

1.  Generate your new encryption key.
    
2.  Update your application such that it can perform decryption using either the old or the new key, depending on the `kid` value in the JWE header.
    
3.  Replace the old key in your JWKS with the new key. The new key should have a different `kid` from the old one.
    
4.  Wait for one hour. This ensures that our cache has expired, and that we will only perform encryption using your new key.
    
5.  Remove the old encryption key from your JWKS.
    

[PreviousTechnical Conceptschevron-left](/docs/technical-specifications/technical-concepts)[NextGeneration Of Client Assertionchevron-right](/docs/technical-specifications/technical-concepts/generation-of-client-assertion)

Last updated 26 days ago

Was this helpful?