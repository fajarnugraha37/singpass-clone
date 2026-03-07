copyCopychevron-down

1.  [INTRODUCTION](/docs/introduction)

# Overview of Singpass

Singpass is Singapore's national digital identity authentication provider using the [OpenID Connect 1.0arrow-up-right](https://openid.net/specs/openid-connect-core-1_0.html) protocol. It stores users' identity information and authenticates them for transactions with government agencies and private organizations online.

## 

[hashtag](#how-singpass-oidc-works)

How Singpass OIDC Works?

circle-info

**OpenID Provider (OP)** is the party that issues the ID token. In this case, Singpass serves as the OpenID provider.

circle-info

**Relying Party (RP)** is the party that requests the ID token from Singpass, which in this context refers to your mobile or web application.

[OpenID Connect 1.0arrow-up-right](https://openid.net/specs/openid-connect-core-1_0.html) offers various authentication flows for integrating an OpenID Provider (OP) and a Relying Party (RP). Singpass as the OpenID Provider supports only the **authorization code flow**. This flow is the most widely used OpenID Connect authentication method, ideal for web applications and native applications that employ a client/server architecture. In this more secure and confidential flow, instead of returning the ID and access tokens directly to the Relying Party, an authorization code is provided. The Relying Party can then exchange the code for the necessary tokens to complete the authentication flow. The token will be used for information exchange if user info is required. The relying Party is required to manage the parsing of JWT used in JWT assertion.

[PreviousFAQchevron-left](/docs/products/singpass-myinfo/faq)[NextUnderstanding the basics of OIDCchevron-right](/docs/introduction/understanding-the-basics-of-oidc)

Last updated 24 days ago

Was this helpful?