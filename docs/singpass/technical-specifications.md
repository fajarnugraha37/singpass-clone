copyCopychevron-down

1.  [Technical Specifications](/docs/technical-specifications)

# Changelog

circle-info

All new Login and Myinfo apps follow Singpass' [FAPI 2.0-compliant API spec](/docs/technical-specifications/integration-guide).

This changelog applies to you only if you are upgrading a Login / Myinfo (v5) integration that was set up prior to Feb 2026. If so, you may wish to refer to [this migration guide](/docs/technical-specifications/migration-guides/login-myinfo-v5-apps).

If you are instead upgrading a legacy Myinfo (v3/v4) app, please refer to our [other migration guides](/docs/technical-specifications/migration-guides).

## 

[hashtag](#the-fapi-2.0-security-profile)

The FAPI 2.0 Security Profile

The FAPI 2.0 Security Profile builds on top of the existing OIDC specifications. Singpass is already OIDC-compliant, which means that you will not need to update your entire existing integration—you will only need to update some parts of the integration.

The following diagram provides an overview of the parts of the Singpass flow that are changing. The changed parts are highlighted in red. For ease of comparison, the same diagram, but for the prior authentication API flow (i.e. without these changes), can be found [here](/docs/technical-specifications/singpass-authentication-api/overview-of-singpass-flow).

You may also view an interactive version of this diagram in [this pagearrow-up-right](https://tinyurl.com/singpass-fapi2-changelog).

![](https://docs.developer.singpass.gov.sg/docs/~gitbook/image?url=https%3A%2F%2F2816701917-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252FW3T7d7fy7OGYkZf4zVKU%252Fuploads%252F59c2TsOuHYy8fDp0JHhq%252Fmermaid-diagram-2025-09-03-101046.png%3Falt%3Dmedia%26token%3D2faab839-d281-4d73-bc3b-bdb540c90a0a&width=768&dpr=3&quality=100&sign=20d66add&sv=2)

## 

[hashtag](#pushed-authorization-requests)

Pushed Authorization Requests

_Relevant steps in sequence diagram: steps 4-7_

Previously, you would have performed the authorization request by redirecting users to an authorization URL containing all the authorization request parameters (such as `redirect_uri`, `client_id`, `scopes` ) in its query parameters.

We will now instead require pushed authorization requests (as specified in [RFC 9126arrow-up-right](https://datatracker.ietf.org/doc/html/rfc9126)) to be performed during the authentication flow. This was done for improved security, as using pushed authorization requests will prevent tampering of the authorization request parameters in the authorization URL.

Switching to pushed authorization requests requires you to make two changes:

1.  Before redirecting the user to the authorization URL, you must first make a POST request to the `pushed_authorization_request_endpoint` (which is published in the authorization server metadata) with a request body containing all the authorization request parameters. This is represented by steps 4-5 in the sequence diagram.
    
2.  When you redirect the user to the authorization URL, the query parameters of the URL should only contain `request_uri` (returned from the pushed authorization request) and your `client_id`.
    

## 

[hashtag](#new-parameters-for-authorization-requests)

New Parameters for Authorization Requests

_Relevant step in sequence diagram: step 4_

We now support some new parameters for authorization requests. These parameters are:

*   `acr_values`
    
*   `authentication_context_type`
    
*   `authentication_context_message`
    

These new parameters, which you will pass in the pushed authorization request, will provide you greater control over what your users will experience during the authentication process. Full details of these parameters can be found in [this page](/docs/technical-specifications/integration-guide/1.-authorization-request#singpass-specific-parameters).

circle-exclamation

Myinfo (v3/v4) apps have authorization requests that differ from Login and Myinfo (v5) apps, so you will need to make more changes if you are currently integrating with a Myinfo (v3/v4) app.

## 

[hashtag](#demonstrating-proof-of-possession-dpop)

Demonstrating Proof-of-Possession (DPoP)

_Relevant steps in sequence diagram: steps 5, 17, and 22_

You may also read [this blog postarrow-up-right](https://auth0.com/blog/what-are-oauth-push-authorization-requests-par/) to understand more about pushed authorization requests.

A DPoP proof (as specified in [RFC 9449arrow-up-right](https://datatracker.ietf.org/doc/html/rfc9449)) is now required for the following requests:

*   The pushed authorization request
    
*   The token request
    
*   The userinfo request
    

This was introduced in order to ensure that both the authorization code and the access token (issued on steps 10-13 and 19 respectively in the sequence diagram) can only be used by you and not by any other party.

You may read more about DPoP in our guide [here](/docs/technical-specifications/technical-concepts/demonstrating-proof-of-possession-dpop).

circle-exclamation

If you are currently integrating with a Myinfo (v4) app, you will only need to add DPoP for the pushed authorization request.

## 

[hashtag](#id-token-encryption-and-format)

ID Token Encryption and Format

_Relevant steps in sequence diagram: steps 20-21_

The ID token will now always be encrypted using JSON Web Encryption (JWE), regardless of the client profile of your app. Previously, the ID token was only encrypted if you had requested for NRIC to be returned in the ID token. Note that this will now require you to add an encryption key into your JWKS, if you do not already have one.

Additionally, the format of the claims returned in the ID token is also different. A summary of the changes are:

*   The `sub` claim will now only contain the UUID of the user. Previously, it contained key-value pairs containing different values depending on your app's client profile and the type of user, but we have now simplified the claim to just always be the UUID.
    
*   If you require NRIC (for SC/PR), FIN (for pass holders) or the foreign ID (for SFA users) to be returned in the ID token, you may request for the new `user.identity` scope. If the scope is requested, then this information will be returned in the new `sub_attributes` claim in the ID token.
    

Here are some examples to illustrate the difference:

chevron-rightID token differences[hashtag](#id-token-differences)

Note: for brevity, the examples here do not contain the whole ID token - they only contain the parts that have changed.

Note also that `sub_account` in the new ID token will only be returned if requested as part of the `scopes` in the authorization request.

User type

Old ID token

New ID token

Singapore Citizen / PR

FIN holders

Singpass Foreign Account

For full details on the new format, you may refer to [ID token specs](/docs/technical-specifications/integration-guide/4.-parsing-the-id-token).

## 

[hashtag](#userinfo-response-format)

Userinfo Response Format

_Relevant step in sequence diagram: step 26_

The userinfo response will have a slightly different format. The format of the data itself remains unchanged - the only difference is that the data is now nested inside a `person_info` field.

The userinfo response will remain encrypted using JWE - no changes will be made on how it is encrypted.

Here's an example to illustrate the difference:

chevron-rightUserinfo payload difference[hashtag](#userinfo-payload-difference)

Old response

New response

circle-exclamation

Myinfo (v3/v4) integrations will also need to start using the userinfo endpoint instead of the Myinfo Get Person API.

## 

[hashtag](#enforcement-of-proof-of-key-code-exchange-pkce)

Enforcement of Proof of Key Code Exchange (PKCE)

We will be enforcing PKCE (specified in [RFC 7636arrow-up-right](https://datatracker.ietf.org/doc/html/rfc7636)) for all integrations with the new authentication API. This is a requirement for FAPI 2.0 compliance, and will help to protect you against misuse of the authorization code. Read more about PKCE in our guide [here](/docs/technical-specifications/technical-concepts/proof-key-for-code-exchange-pkce).

## 

[hashtag](#removal-of-support-for-custom-scheme-urls)

Removal Of Support For Custom Scheme URLs

Previously, custom scheme URLs (i.e. URLs that do not use the `https://` scheme) were allowed to be registered as redirect URLs and app launch URLs. This was done to support redirection to mobile apps.

We will be dropping support for the usage of such URLs with the new specifications. If you are currently using custom scheme URLs for mobile app redirection, you are required to instead use App-claimed https URLs ([Universal Linksarrow-up-right](https://developer.apple.com/documentation/xcode/allowing-apps-and-websites-to-link-to-your-content) for iOS, and [App Linksarrow-up-right](https://developer.android.com/training/app-links) for Android) for this purpose instead. This is being done to ensure that redirects from Singpass cannot be intercepted by malicious applications.

### 

[hashtag](#authentication-error-responses)

Authentication Error Responses

Currently, we generally do not redirect back to your redirect URL when an error occurs. This will change with the new authentication API. We will now be redirecting back to your redirect URL in more scenarios with an Authentication Error Response, which is specified in [section 3.1.2.6 of the OpenID specificationsarrow-up-right](https://openid.net/specs/openid-connect-core-1_0.html#AuthError).

With this change, you will get more information about what are the errors that users face while authenticating with Singpass, and can handle the error flows appropriately. However, this also means that you must ensure that you have proper error handling in place for these errors.

View our [Integration Guide](/docs/technical-specifications/integration-guide/2.-handling-the-redirect#failed-authentication) to see the full list of errors that could be sent to you during the redirect.

## 

[hashtag](#changes-in-amr-claim-values)

Changes In \`amr\` Claim Values

The `amr` claim values returned in the ID token have been updated. You can ignore this section if you have not been reading the `amr` claim values.

Note that if you have previously been reading the `amr` claim values to determine the level of assurance of the authentication transaction, we recommend that you read the new `acr` claim value instead, which directly provides the level of assurance without requiring you to map the `amr` values to a level of assurance. By using the `acr` claim instead of the `amr` claim, you would not need to update your implementation should we introduce new form factors.

Specifically, the following changes have been made:

### 

[hashtag](#change-in-naming)

Change in naming

Some of the `amr` values have had their names changed for clarity. Specifically, these three claims have changed:

Previous value

New value

`sms`

`otp-sms`

`fv`

`face`

`fv-alt`

`face-alt`

### 

[hashtag](#provision-of-all-form-factors-when-face-verification-is-used)

Provision of all form factors when face verification is used

Previously, when face verification was used **as a third factor** during the authentication, the `amr` claim would only be `["fv"]`, even though multiple form factors were used in the authentication.

With the FAPI2.0 implementation, the `amr` claim would now always contain all form factors used in order to provide more clarity. For example:

Form factors used

Previous amr

New amr

Username/password, SMS OTP, face verification

`["fv"]`

`["pwd", "otp-sms", "face"]`

QR, face verification

`["fv"]`

`["swk", "face"]`

Username/password, face verification

`["pwd", "fv"]`

`["pwd", "face"]` (note: no change in number of elements, since face verification was used as a second factor)

[PreviousUnderstanding the basics of OIDCchevron-left](/docs/introduction/understanding-the-basics-of-oidc)[NextIntegration Guidechevron-right](/docs/technical-specifications/integration-guide)

Last updated 24 days ago

Was this helpful?