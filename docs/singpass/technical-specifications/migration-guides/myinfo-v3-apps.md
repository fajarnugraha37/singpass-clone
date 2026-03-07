copyCopychevron-down

1.  [Technical Specifications](/docs/technical-specifications)chevron-right
2.  [Migration Guides](/docs/technical-specifications/migration-guides)

# Myinfo (v3) apps

## 

[hashtag](#overview)

Overview

The Myinfo (v3) integration differs significantly from the new Authentication API, as while Myinfo (v3) wes based on OAuth 2.0, the new Authentication API is based on OIDC with the FAPI 2.0 Security Profile, which contains several extensions to the OAuth 2.0 flow.

Due to these differences, we recommend that you perform a new integration from scratch using one of the [certified OIDC Relying Party Librariesarrow-up-right](https://openid.net/developers/certified-openid-connect-implementations/), instead of updating your existing integration. Doing so should simplify your integration. You can refer to our [Integration Guide](/docs/technical-specifications/integration-guide) to understand how to perform a new integration.

Regardless of which approach you choose to take, this document will highlight all of the differences between your existing integration and the new integration.

## 

[hashtag](#creating-new-app)

Creating New App

Before you start on the new integration, you must first create a new Myinfo (v5) app on the Singpass Developer Portal. Your existing Myinfo (v3) app cannot be used for the new integration.

Refer to our User Guide to understand how to create your [staging app](/docs/singpass-developer-portal-sdp/user-guide/create-staging-app) (for testing purposes) and your [production app](/docs/singpass-developer-portal-sdp/user-guide/create-production-app).

There are two important differences between the setup for Myinfo (v3) apps and Myinfo (v5) apps:

1.  Myinfo (v5) apps should only have a single purpose. If your current Myinfo (v3) app has multiple purposes, you will need to create a new Myinfo (v5) app for each purpose.
    
2.  Myinfo (v5) apps perform authentication and verification using JSON Web Key Sets (JWKS) instead of using X.509 public key certificates. You will be required to configure your JWKS instead of your certificate when creating your new Myinfo (v5) apps. Your JWKS must have at least one signing key and one encryption key.
    

## 

[hashtag](#changes-required)

Changes Required

### 

[hashtag](#general)

General

#### 

[hashtag](#id-1.-implement-demonstrating-of-proof-of-possession-dpop)

1\. Implement Demonstrating of Proof of Possession (DPoP)

DPoP is a security mechanism in which the access token and authorization code is bound to a ephemeral private key that is known only to you, preventing malicious parties from using your code or token.

Read our [DPoP guide](/docs/technical-specifications/technical-concepts/demonstrating-proof-of-possession-dpop) for instructions on how to implement DPoP.

#### 

[hashtag](#id-2.-update-custom-scheme-urls)

2\. Update custom scheme URLs

The new Authentication API no longer supports the use of custom scheme URLs (i.e. URLs that do not start with `https://` ) as redirect URLs or app launch URLs.

If you are currently integrating with Myinfo via an Android or iOS app, and rely on such URLs for redirection back to the mobile app, you will need to change these URLs to use app-claimed HTTPS URLs instead. App-claimed HTTPS URLs are HTTPS URLs which, when opened on a mobile device, will launch your mobile app.

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

[hashtag](#id-2.-remove-parameters-that-are-no-longer-used)

2\. Remove parameters that are no longer used

There are some parameters in the authorization request which are no longer required in the new API. These parameters should be removed from the authorization request:

*   `authmode`
    
*   `purpose` (this will be configured in the Singpass Developer Portal instead of being sent for every request)
    
*   `login_type`
    

#### 

[hashtag](#id-3.-update-existing-parameters)

3\. Update existing parameters

There are some parameters used in the Myinfo (v3) parameters which are still used in the new API, but they have been changed, as detailed below:

Old parameter name

New parameter name

Other changes

attributes

scope

This needs to be changed from a comma-separated string to a space-separated string, and `openid` has to be added. For example:

*   old: `name,hanyupinyinname`
    
*   new: `openid name hanyupinyinname`
    

appLaunchURL

app\_launch\_url

The app launch URL you are using will need to be pre-registered in the Singpass Developer Portal

#### 

[hashtag](#id-4.-add-parameters-for-proof-of-key-code-exchange-pkce)

4\. Add parameters for Proof of Key Code Exchange (PKCE)

You are required to implement PKCE for the authentication flow in the new API. Read our [PKCE guide](/docs/technical-specifications/technical-concepts/proof-key-for-code-exchange-pkce) for instructions on how to implement PKCE.

#### 

[hashtag](#id-5.-add-nonce-parameter)

5\. Add nonce parameter

You are required to include a `nonce` in your authorization request for the new API. Refer to our [Integration Guide](/docs/technical-specifications/integration-guide/1.-authorization-request#basic-oidc-parameters) to understand how the `nonce` should be generated and what it is used for.

### 

[hashtag](#token-exchange)

Token Exchange

#### 

[hashtag](#id-1.-add-parameters-for-proof-of-key-code-exchange-pkce)

1\. Add parameters for Proof of Key Code Exchange (PKCE)

As part of the PKCE implementation, you will need to include the `code_verifier` as part of the request body when making the request to the token endpoint. This must be the same `code_verifier` that you had used to generate the `code_challenge` when making the authorization request earlier.

#### 

[hashtag](#id-2.-authenticate-using-client-assertion-instead-of-pki-signature)

2\. Authenticate using client assertion instead of PKI Signature

In the new API, you will authenticate yourself when calling the token endpoint by generating a client assertion instead of a PKI signature. Specifically:

*   You should no longer send an `Authorization` header when calling the token endpoint
    
*   You should no longer send the `client_secret` in the request body
    
*   You will need to send `client_assertion` and `client_assertion_type` in the request body. Refer to our [Integration Guide](/docs/technical-specifications/integration-guide/3.-token-exchange#request-body) to understand what the values of these parameters should be.
    

#### 

[hashtag](#id-3.-remove-the-state-parameter)

3\. Remove the state parameter

The new API does not support the `state` parameter in the request body, so it should be removed.

#### 

[hashtag](#id-4.-parse-the-id-token)

4\. Parse the ID token

In the new API, the token request returns an encrypted ID token in addition to the access token. You should decrypt this ID token and perform verification checks to ensure that it is legitimate.

Read our [Integration Guide](/docs/technical-specifications/integration-guide/4.-parsing-the-id-token) to understand how to perform the decryption and what sort of verification checks are required.

### 

[hashtag](#userinfo-request)

Userinfo Request

The userinfo request replaces the Person API call used in Myinfo (v3). Refer to our [Integration Guide](/docs/technical-specifications/integration-guide/5.-requesting-for-userinfo#sample-request) for the full specifications of the new userinfo request.

Here's a quick comparison of the two endpoints:

Userinfo

Person API

Request

Response

The exact changes required are listed below.

#### 

[hashtag](#id-1.-remove-sub-from-the-path)

1\. Remove sub from the path

In Myinfo (v3), you were required to pass the `sub` from the access token as a path parameter when calling the Person API. This is no longer required in the new API. You should no longer perform any parsing of the access token.

If you still wish to obtain the UUID of the user, you should do so by parsing the ID token instead.

#### 

[hashtag](#id-2.-remove-pki-signature)

2\. Remove PKI Signature

PKI signature is no longer needed for the API call. Instead, authentication is done via [DPoP](/docs/technical-specifications/migration-guides/myinfo-v3-apps#id-1.-implement-demonstration-of-proof-of-possession-dpop) and the access token.

Thus, you should update your Authorization header to only include the access token in the format `DPoP <your_access_token>`.

#### 

[hashtag](#id-3.-remove-all-query-parameters)

3\. Remove all query parameters

The new API does not require any query parameters in the userinfo request. All of the user's data belonging to the scopes requested during the Authorization request will be returned.

#### 

[hashtag](#id-4.-handle-the-new-format-of-the-userinfo-response)

4\. Handle the new format of the userinfo response

The userinfo response has a slightly different format compared to the response of the Person API. The format of the data itself remains unchanged - the only difference is that the data is now nested inside a `person_info` field.

You will thus need to update your parsing logic to extract the user's data from the `person_info` field, instead of from the root of the response data.

#### 

[hashtag](#id-5.-update-access-token-prefix)

5\. Update access token prefix

When calling the Person API, your access token would have had a `Bearer` prefix:

In the new API, you should change this prefix to `DPoP`:

[PreviousLogin / Myinfo (v5) appschevron-left](/docs/technical-specifications/migration-guides/login-myinfo-v5-apps)[NextMyinfo (v4) appschevron-right](/docs/technical-specifications/migration-guides/myinfo-v4-apps)

Last updated 24 days ago

Was this helpful?