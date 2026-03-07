copyCopychevron-down

1.  [Technical Specifications](/docs/technical-specifications)

# (Legacy) Pre-FAPI 2.0 API Specifications

triangle-exclamation

All Login and Myinfo apps must follow Singpass' [FAPI 2.0-compliant authentication API](/docs/technical-specifications/integration-guide) by 31 Dec 2026.

The specifications on this page apply to you only if you are maintaining an existing Login / Myinfo (v5) integration. We encourage you to [migrate](/docs/technical-specifications/migration-guides/login-myinfo-v5-apps) early to avoid service disruptions.

The purpose of this guide is to describe the necessary APIs that Relying Parties (RPs) must invoke to facilitate an Open ID Connect (OIDC) authentication for a Singpass user via the Redirect Authentication Flow.

RPs are to implement the following steps:

**Frontend:**

*   Step 1a: Redirect to [Authorization endpointarrow-up-right](https://github.com/SingpassPX/dev-docs/blob/main/technical-specifications/singpass-authentication-api/1.-authorization-endpoint).
    

**Backend:**

*   Step 4: Exchange auth code with ID token (involves client authentication) using [Token endpointarrow-up-right](https://github.com/SingpassPX/dev-docs/blob/main/technical-specifications/singpass-authentication-api/2.-token-endpoint).
    

[PreviousMyinfo (v4) appschevron-left](/docs/technical-specifications/migration-guides/myinfo-v4-apps)[NextOverview of Singpass Flowchevron-right](/docs/technical-specifications/singpass-authentication-api/overview-of-singpass-flow)

Last updated 24 days ago

Was this helpful?