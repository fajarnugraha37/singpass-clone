copyCopychevron-down

1.  [Technical Specifications](/docs/technical-specifications)chevron-right
2.  [Migration Guides](/docs/technical-specifications/migration-guides)

# Login / Myinfo (v5) apps

## 

[hashtag](#overview)

Overview

If you are migrating an existing Login or Myinfo (v5) app, there will not be any need for you to create a new app in the Singpass Developer Portal. Instead, you can integrate with the new authentication API using your existing app.

During the migration process, you can simultaneously have integrations with both the old authentication API and the new one. How this will work will be as follows:

*   If you send the authorization request parameters via [pushed authorization request](/docs/technical-specifications/integration-guide/1.-authorization-request#id-1.-sending-the-pushed-authorization-request), then the new API will be used for that authentication flow.
    
*   If you send the authorization request parameters via a [browser redirect to the authorization endpointarrow-up-right](https://github.com/SingpassPX/dev-docs/blob/main/technical-specifications/singpass-authentication-api/1.-authorization-endpoint), then the old API will be used for that authentication flow.
    

This will allow you to test your new integration or to perform a staged rollout of the new integration in production without affecting the existing integration, so long as pushed authorization requests are only used when the new API is going to be used.

## 

[hashtag](#changes-required)

Changes Required

Listed below are the changes that you will need to make to your existing integration for it to work with the new authentication API.

### 

[hashtag](#general)

General

#### 

[hashtag](#id-1.-implement-demonstration-of-proof-of-possession-dpop)

1\. Implement Demonstration of Proof of Possession (DPoP)

DPoP is a security mechanism in which the access token and authorization code is bound to a private key that is known only to you, preventing malicious parties from using your code or token.

Read our [guide to DPoP](/docs/technical-specifications/technical-concepts/demonstrating-proof-of-possession-dpop) to understand how to implement it.

#### 

[hashtag](#id-2.-handle-authentication-error-responses)

2\. Handle Authentication Error Responses

In the old Authentication API, we do not always redirect back to your redirect URL when an error occurs. In the new API, we will be redirecting back to your redirect URL on most errors, with an Authentication Error Response, which is specified in [section 3.1.2.6 of the OpenID specificationsarrow-up-right](https://openid.net/specs/openid-connect-core-1_0.html#AuthError).

You should refer to our [Integration Guide](/docs/technical-specifications/integration-guide/2.-handling-the-redirect) to understand how to handle these responses.

#### 

[hashtag](#id-3.-update-custom-scheme-urls)

3\. Update custom scheme URLs

The new Authentication API no longer supports the use of custom scheme URLs (i.e. URLs that do not start with `https://` ) as redirect URLs or app launch URLs.

If you are currently integrating with Singpass via an Android or iOS app, and rely on such URLs for redirection back to the mobile app, you will need to change these URLs to use app-claimed HTTPS URLs instead. App-claimed HTTPS URLs are HTTPS URLs which, when opened on a mobile device, will launch your mobile app.

Android applications support app-claimed HTTPS URLs via Android App Links, while iOS applications support them via universal links. Read the [official Android documentationarrow-up-right](https://developer.android.com/training/app-links) and the [official iOS documentationarrow-up-right](https://developer.apple.com/documentation/xcode/supporting-universal-links-in-your-app) to understand how to implement Android App Links and universal links respectively.

Once your applications support redirection via app-claimed HTTPS, you should update your app's configuration in the Singpass Developer Portal to add your new HTTPS URLs. Refer to our [Singpass Developer Portal User Guide](/docs/singpass-developer-portal-sdp/user-guide/edit-production-app) if you are unsure on how to do this.

You will also need to update your backend integration with us. Specifically, you will need to change these parameters in your authorization request:

1.  The `redirect_uri` and `app_launch_url` parameters must be updated to use the new HTTPS URLs that you have configured.
    
2.  The `redirect_uri_https_type` parameter in the authorization request should be added with a value of `app_claimed_https` , to indicate that the redirection is being done using an app-claimed HTTPS URL.
    

Once the backend changes are completed and deployed, you should proceed to remove the old custom scheme URLs from your app's configuration in the Singpass Developer Portal.

### 

[hashtag](#authorization-request)

Authorization Request

#### 

[hashtag](#id-1.-use-pushed-authorization-request)

1\. Use pushed authorization request

In your existing integration, you would have sent the authorization request by redirecting the user to the authorization endpoint, with the authorization request parameters being included as query parameters.

In the new integration, you should instead send the authorization request parameters by first sending the authorization request parameters via a pushed authorization request, which will return a short-lived `request_uri` in the response. You should then redirect the user the user to the authorization endpoint, with the `request_uri`, together with your `client_id`, as query parameters.

For more details, you may refer to our [Integration Guide](/docs/technical-specifications/integration-guide/1.-authorization-request#id-1.-sending-the-pushed-authorization-request).

#### 

[hashtag](#id-2.-add-parameters-for-proof-key-for-code-exchange-pkce)

2\. Add parameters for Proof Key for Code Exchange (PKCE)

PKCE is required for all apps in the new API. If you are not yet sending `code_challenge` and `code_challenge_method` in your authentication request, you are required to do so for the new API.

Read our [guide on PKCE](/docs/technical-specifications/technical-concepts/proof-key-for-code-exchange-pkce) to better understand what you need to do.

#### 

[hashtag](#id-3.-only-for-login-apps-add-authentication_context_type-to-the-authentication-request)

3\. (Only for Login apps) Add authentication\_context\_type to the authentication request

If you are integrating using a Login app, you will need to add a new parameter called `authentication_context_type` into the authorization request parameters, which should be sent as part of the pushed authorization request. Read more about this new parameter in our [Integration Guide](/docs/technical-specifications/integration-guide/1.-authorization-request#singpass-specific-parameters).

### 

[hashtag](#token-exchange)

Token Exchange

#### 

[hashtag](#id-1.-implement-decryption-of-the-id-token)

1\. Implement decryption of the ID token

In the new authentication API, all ID tokens will be encrypted. You will need to implement ID token decryption if you are currently receiving unencrypted ID tokens during token exchange. Additionally, you must add an encryption key to your JWKS if you do not already have one.

circle-info

You will be receiving unencrypted ID tokens if your app's profile type is set to "UUID Only". You can view your app's profile type in the [Singpass Developer Portalenvelope](/cdn-cgi/l/email-protection#b6c3d8d2d3d0dfd8d3d2).

No changes are required if you are already performing decryption of the ID token.

You can refer to our [Integration Guide](/docs/technical-specifications/integration-guide/4.-parsing-the-id-token) to better understand how the ID token is being encrypted.

#### 

[hashtag](#id-2.-update-parsing-of-the-sub-claim)

2\. Update parsing of the sub claim

Previously, the `sub` claim in the ID token contained comma-separated key-value pairs containing various attributes. It now contains only the user's UUID:

Previous

New

Due to this change, you should remove any custom parsing logic that you have previously implemented to extract the values of each field from the `sub` claim. If you require only the user's UUID, you can now simply read the value of the `sub` claim without needing any more parsing. Read the next section if you require other details that was previously in the `sub` claim.

#### 

[hashtag](#id-3.-request-for-the-new-user.identity-scope-and-read-the-new-sub_attributes-claim)

3\. Request for the new `user.identity` scope and read the new `sub_attributes` claim

In your current integration, you may be retrieving the following information from the `sub` claim in the ID token:

*   The user's NRIC/FIN
    
*   The user's foreign ID or the country of issuance for the foreign ID (for Singapore Foreign Account users)
    

In the new integration, this information is now instead returned in a newly introduced `sub_attributes` claim in the ID token. For this new claim to be returned, you must first update your app's configuration in the Singpass Developer Portal to request for the new `user.identity` scope for your app. Refer to our [Singpass Developer Portal User Guide](/docs/singpass-developer-portal-sdp/user-guide/edit-production-app) if you are unsure on how to do this.

Once the new scope has been approved, the `sub_attributes` claim will be returned in the ID token if you are using the new API. Refer to our [Integration Guide](/docs/technical-specifications/integration-guide/4.-parsing-the-id-token#the-sub_account-claim) to understand the structure of this new claim.

### 

[hashtag](#userinfo-request)

Userinfo Request

#### 

[hashtag](#id-1.-handle-the-new-format-of-the-userinfo-response)

1\. Handle the new format of the userinfo response

The userinfo response will have a slightly different format. The format of the data itself remains unchanged - the only difference is that the data is now nested inside a `person_info` field.

You will thus need to update your parsing logic to extract the user's data from the `person_info` field, instead of from the root of the response data.

#### 

[hashtag](#id-2.-update-authorization-header-prefix-to-be-dpop-instead-of-bearer)

2\. Update Authorization header prefix to be DPoP instead of Bearer

In the old API, the Authorization header would have been sent as a bearer token, in this format:

In the new API, it should be sent with a `DPoP` prefix instead:

[PreviousMigration Guideschevron-left](/docs/technical-specifications/migration-guides)[NextMyinfo (v3) appschevron-right](/docs/technical-specifications/migration-guides/myinfo-v3-apps)

Last updated 1 day ago

Was this helpful?