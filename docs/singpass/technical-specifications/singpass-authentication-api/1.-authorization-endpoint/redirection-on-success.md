copyCopychevron-down

1.  [Technical Specifications](/docs/technical-specifications)chevron-right
2.  [(Legacy) Pre-FAPI 2.0 API Specifications](/docs/technical-specifications/singpass-authentication-api)chevron-right
3.  [1\. Authorization Endpoint](/docs/technical-specifications/singpass-authentication-api/1.-authorization-endpoint)

# Redirection on success

triangle-exclamation

All Login and Myinfo apps must follow Singpass' [FAPI 2.0-compliant authentication API](/docs/technical-specifications/integration-guide) by 31 Dec 2026.

The specifications on this page apply to you only if you are maintaining an existing Login / Myinfo (v5) integration. We encourage you to [migrate](/docs/technical-specifications/migration-guides/login-myinfo-v5-apps) early to avoid service disruptions.

Once the user has authenticated successfully, Singpass will redirect the browser to the RP’s registered `redirectUri` along with the `code` and `state` parameters or an interstitial page for users have launched authentication from the RP’s native app.

The interstitial page is required to solicit a user interaction for launching from certain in-app browsers. Singpass will redirect to the interstitial page if the `redirectUri` is custom-schemed or app-claimed HTTPS. To specify that the `redirectUri` is an app-claimed HTTPS, the RP must include the query parameter `redirect_uri_https_type=app_claimed_https` at [Authorization endpoint](/docs/technical-specifications/singpass-authentication-api/1.-authorization-endpoint).

Example redirect location: `**https://partner.gov.sg/redirect?code=XcyzlSeX1hIyJFlstxsSF_UeXC5DtiYkFgJ8VVx52mg&state=NGRlZThmNzQtZDU5YS00YTY1LWFkODItYmE4NDA4Y2UwY2Uw**`

Parameter

Description

code

A securely generated random number in **base64-url** format. This parameter must be sent to the [Token endpoint](/docs/technical-specifications/singpass-authentication-api/2.-token-endpoint) along with others to exchange for the user’s ID token.

state

The same `state` parameter provided to the [Authorization endpoint](/docs/technical-specifications/singpass-authentication-api/1.-authorization-endpoint).

Once redirected, the RP should invoke the [Token endpoint](/docs/technical-specifications/singpass-authentication-api/2.-token-endpoint) to obtain an ID token and complete the login process.

> Note: The `code` parameter has a lifetime of **2 minutes**. RPs must exchange it for an ID token within this period.

[Previous1\. Authorization Endpointchevron-left](/docs/technical-specifications/singpass-authentication-api/1.-authorization-endpoint)[NextFor Mobile Developerschevron-right](/docs/technical-specifications/singpass-authentication-api/1.-authorization-endpoint/for-mobile-developers)

Last updated 24 days ago

Was this helpful?