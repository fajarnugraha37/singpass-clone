copyCopychevron-down

1.  [Technical Specifications](/docs/technical-specifications)chevron-right
2.  [Migration Guides](/docs/technical-specifications/migration-guides)

# Myinfo (v4) apps

## 

[hashtag](#overview)

Overview

The protocol used by Myinfo (v4) apps is largely similar to the one used by the new FAPI 2.0 API. The changes required mostly involve configuring new Myinfo (v5) apps, adopting Pushed Authorization Requests, and making minor changes to your request/response parsing.

## 

[hashtag](#creating-new-app)

Creating New App

Before you start on the new integration, you must first create a new Myinfo (v5) app on the Singpass Developer Portal. Your existing Myinfo (v4) app cannot be used for the new integration.

Refer to our User Guide to understand how to create your [staging app](/docs/singpass-developer-portal-sdp/user-guide/create-staging-app) (for testing purposes) and your [production app](/docs/singpass-developer-portal-sdp/user-guide/create-production-app).

Note that Myinfo (v5) apps should only have a single purpose. If your current Myinfo (v4) app has multiple purposes, you will need to create a new Myinfo (v5) app for each purpose.

## 

[hashtag](#changes-required)

Changes Required

Listed below are the changes that you will need to make to your existing integration for it to work with the new authentication API.

### 

[hashtag](#general)

General

#### 

[hashtag](#id-1.-update-custom-scheme-urls)

1\. Update custom scheme URLs

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

Note that the DPoP header needs to be sent when making the pushed authorization request. The DPoP header that you send for this request should be generated in the same way as the DPoP header you currently generate when calling the token API for your Myinfo (v4) app.

For more details, you may refer to our [Integration Guide](/docs/technical-specifications/integration-guide/1.-authorization-request#id-1.-sending-the-pushed-authorization-request).

#### 

[hashtag](#id-2.-remove-parameters-that-are-no-longer-used)

2\. Remove parameters that are no longer used

There are some parameters in the authorization request which are no longer required in the new API. These parameters should be removed from the authorization request:

*   `subentity_id`
    
*   `purpose_id` (this will be configured in the Singpass Developer Portal instead of being sent for every request)
    

#### 

[hashtag](#id-3.-ensure-app_launch_url-is-pre-registered-in-the-singpass-developer-portal)

3\. Ensure app\_launch\_url is pre-registered in the Singpass Developer Portal

In the new Authentication API, the app launch URLs must be pre-registered with us when you configure your app in the Singpass Developer Portal.

If you use the `app_launch_url` parameter, you will need to ensure that the value you are sending in this parameter has been pre-registered in your app's configuration.

#### 

[hashtag](#id-4.-add-nonce-and-state-parameter)

4\. Add nonce and state parameter

You are required to include a `nonce` and `state` in your authorization request for the new API. Refer to our [Integration Guide](/docs/technical-specifications/integration-guide/1.-authorization-request#basic-oidc-parameters) to understand how these parameters should be generated and what they are used for.

### 

[hashtag](#token-exchange)

Token Exchange

#### 

[hashtag](#id-1.-parse-the-id-token)

1\. Parse the ID token

In the new API, the token request returns an encrypted ID token in addition to the access token. You should decrypt this ID token and perform verification checks to ensure that it is legitimate.

Read our [Integration Guide](/docs/technical-specifications/integration-guide/4.-parsing-the-id-token) to understand how to perform the decryption and what sort of verification checks are required.

#### 

[hashtag](#id-2.-update-your-client-assertion-implementation)

2\. Update your client assertion implementation

You should no longer include `cnf.jkt` in the JWT payload for your client assertion. Instead, you should include a new parameter, `code`, whose value should be the authorization code that you received when handling the redirect. Aside from these changes, the method to generate the client assertion should be the same as the method you are currently using for your Myinfo (v4) app.

Refer to our [guide on generating client assertions](/docs/technical-specifications/technical-concepts/generation-of-client-assertion) for the full reference on generating client assertions for the new API.

### 

[hashtag](#userinfo-request)

Userinfo Request

The userinfo request replaces the Person API call used in Myinfo (v4), but the authentication mechanism is the same. Refer to our [Integration Guide](/docs/technical-specifications/integration-guide/5.-requesting-for-userinfo#sample-request) to view a sample request.

Here's a quick comparison of the two endpoints:

Userinfo

Person API

Request

Response

#### 

[hashtag](#id-1.-remove-sub-from-the-path)

1\. Remove sub from the path

In Myinfo (v4), you were required to pass the `sub` from the access token as a path parameter when calling the Person API. This is no longer required in the new API. You should no longer perform any parsing of the access token.

If you still wish to obtain the UUID of the user, you should do so by parsing the ID token instead.

#### 

[hashtag](#id-2.-remove-all-query-parameters)

2\. Remove all query parameters

The new API does not require any query parameters in the userinfo request. All of the user's data belonging to the scopes requested during the Authorization request will be returned.

#### 

[hashtag](#id-3.-handle-the-new-format-of-the-userinfo-response)

3\. Handle the new format of the userinfo response

The userinfo response has a slightly different format compared to the response of the Person API. The format of the data itself remains unchanged - the only difference is that the data is now nested inside a `person_info` field.

You will thus need to update your parsing logic to extract the user's data from the `person_info` field, instead of from the root of the response data.

[PreviousMyinfo (v3) appschevron-left](/docs/technical-specifications/migration-guides/myinfo-v3-apps)[Next(Legacy) Pre-FAPI 2.0 API Specificationschevron-right](/docs/technical-specifications/singpass-authentication-api)

Last updated 24 days ago

Was this helpful?