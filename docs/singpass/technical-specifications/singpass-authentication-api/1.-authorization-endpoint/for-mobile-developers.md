copyCopychevron-down

1.  [Technical Specifications](/docs/technical-specifications)chevron-right
2.  [(Legacy) Pre-FAPI 2.0 API Specifications](/docs/technical-specifications/singpass-authentication-api)chevron-right
3.  [1\. Authorization Endpoint](/docs/technical-specifications/singpass-authentication-api/1.-authorization-endpoint)

# For Mobile Developers

triangle-exclamation

All Login and Myinfo apps must follow Singpass' [FAPI 2.0-compliant authentication API](/docs/technical-specifications/integration-guide) by 31 Dec 2026.

The specifications on this page apply to you only if you are maintaining an existing Login / Myinfo (v5) integration. We encourage you to [migrate](/docs/technical-specifications/migration-guides/login-myinfo-v5-apps) early to avoid service disruptions.

To facilitate your in-app browser implementation, the following table contains technical resources to help assess, test and implement the changes requested.

Android

iOS

Sample codes implementing the recommended Proof Key for Code Exchange ([PKCEarrow-up-right](https://www.rfc-editor.org/rfc/rfc8252)) for Singpass logins

[Android-Singpass-in-app-browser-login-demoarrow-up-right](https://github.com/singpass/Android-Singpass-in-app-browser-login-demo)

[iOS-Singpass-in-app-browser-login-demoarrow-up-right](https://github.com/singpass/iOS-Singpass-in-app-browser-login-demo)

In-app browser documentations

[Chrome Custom Tabsarrow-up-right](https://developer.chrome.com/docs/android/custom-tabs)

\[iOS 9 to iOS 10\] [SFSafariViewControllerarrow-up-right](https://developer.apple.com/documentation/safariservices/sfsafariviewcontroller) \[iOS 11\] [SFAuthenticationSessionarrow-up-right](https://developer.apple.com/documentation/safariservices/sfauthenticationsession) \[iOS 12 and above\] [ASWebAuthenticationSessionarrow-up-right](https://developer.apple.com/documentation/authenticationservices/aswebauthenticationsession)

[PreviousRedirection on successchevron-left](/docs/technical-specifications/singpass-authentication-api/1.-authorization-endpoint/redirection-on-success)[Next2\. Token Endpointchevron-right](/docs/technical-specifications/singpass-authentication-api/2.-token-endpoint)

Last updated 24 days ago

Was this helpful?