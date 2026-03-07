copyCopychevron-down

1.  [Technical Specifications](/docs/technical-specifications)chevron-right
2.  [Technical Concepts](/docs/technical-specifications/technical-concepts)

# OpenID Provider Configuration

Singpass' authorization server exposes an endpoint from which you can retrieve metadata about how Singpass is configured as an OpenID Provider:

Environment

Discovery Endpoint

Staging

[https://stg-id.singpass.gov.sg/fapi/.well-known/openid-configurationarrow-up-right](https://stg-id.singpass.gov.sg/fapi/.well-known/openid-configuration)

Production

[https://id.singpass.gov.sg/fapi/.well-known/openid-configurationarrow-up-right](https://id.singpass.gov.sg/fapi/.well-known/openid-configuration)

The metadata hosted at this endpoint is crucial for your integration. It tells you things like:

*   The various endpoints and URIs that you will need, and
    
*   Supported scopes, response types, and encryption/signing algorithms
    

Because [OpenID Connect Discoveryarrow-up-right](https://openid.net/specs/openid-connect-discovery-1_0.html) is part of the OIDC spec, if you are using an OpenID-certified relying party library, the library may automatically retrieve metadata from our discovery endpoint for you. In such cases, you may not be aware of this detail.

Please be aware, however, that Singpass' OpenID configuration is not static, and you should regularly fetch from our discovery endpoint to ensure freshness. At the same time, you should also avoid fetching from this endpoint too frequently, e.g. for every authentication request. Instead, consider caching responses for at least an hour.

[PreviousDemonstrating Proof of Possession (DPoP)chevron-left](/docs/technical-specifications/technical-concepts/demonstrating-proof-of-possession-dpop)[NextMigration Guideschevron-right](/docs/technical-specifications/migration-guides)

Last updated 24 days ago

Was this helpful?