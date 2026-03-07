copyCopychevron-down

1.  [INTRODUCTION](/docs/introduction)

# Understanding the basics of OIDC

[OpenID Connect 1.0arrow-up-right](https://openid.net/specs/openid-connect-core-1_0.html) (OIDC) is a simple identity layer on top of the OAuth 2.0 protocol. It:

*   Allows clients to verify the identity of the end user based on the authentication performed by an Authorization Server
    
*   Allows clients to obtain basic profile information about the end user in an interoperable and REST-like manner
    
*   Allows clients of all types, including Web-based, mobile, and JavaScript clients, to request and receive information about authenticated sessions and end-users
    

## 

[hashtag](#oidc-actors)

OIDC Actors

There are several actors involved in the Open ID Connect protocol. The following sections will detail each actor involved in the communication.

![](https://docs.developer.singpass.gov.sg/docs/~gitbook/image?url=https%3A%2F%2Fcontent.gitbook.com%2Fcontent%2FW3T7d7fy7OGYkZf4zVKU%2Fblobs%2FdMYOKCGMG24UsGAp0vZ1%2Factors.png&width=768&dpr=3&quality=100&sign=2535c12c&sv=2)

OIDC Actors Flowchart

chevron-right**OIDC Provider (OP)**[hashtag](#oidc-provider-op)

Singpass is an OpenID provider and it is the “vouch for” party in an identity federation. That is, it gives assurances of the identity of the user to the other party. The OpenID provider is responsible for:

*   Managing users and their identities
    
*   Issuing tokens
    
*   Handling user administration
    
*   Authenticating the user
    
*   Vouching for the user's identity with the relying party
    
*   Revoking user’s authenticated sessions and tokens
    

chevron-right**Client or Relying Party (RP)**[hashtag](#client-or-relying-party-rp)

The business entity will implement the relying party (also client or consumer) which will be the “validating party” in a transaction. The relying party or client is responsible for:

*   Controlling access to services
    
*   Validating the various tokens issued by OpenID Provider
    
*   Validating the asserted identity information from the OpenID provider (typically by way of verifying a digital signature)
    
*   Providing access based on asserted identity
    
*   Managing only locally relevant user attributes, not an entire user profile
    
*   Each client must be registered with an OpenID provider.
    

The clients registered with Singpass OP must be confidential clients, which means every client must be registered with Singpass OP with their `Client ID` and `JWT Assertion`.

chevron-right**User Agent**[hashtag](#user-agent)

The user agent is a web browser or mobile browser or mobile application via which the user (resource owner) will initiate the communication with the OpenID Provider and Relying Party:

*   Serves static or dynamic pages
    
*   Handles redirections
    
*   May store cookies, user, and session information
    
*   Should not be used to store confidential data like user identity or tokens
    

chevron-right**Resource Owner**[hashtag](#resource-owner)

The resource owner could be an end-user or an entity capable of granting access to protected resources. In most cases, it would be the user accessing agency applications.

chevron-right**Resource Server**[hashtag](#resource-server)

The resource server will be hosted on the agencies' perimeter. It is the server that is hosting the applications protected by the relying party. Agencies' relying party will communicate with Singpass OP before granting access to protected resources hosted on the resource server.

Here are some additional resources for learning more about OAuth 2.0 and OIDC:

[PreviousOverview of Singpasschevron-left](/docs/introduction/overview-of-singpass)[NextChangelogchevron-right](/docs/technical-specifications/changelog)

Last updated 25 days ago

Was this helpful?