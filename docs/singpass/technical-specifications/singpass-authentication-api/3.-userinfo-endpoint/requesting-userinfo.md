copyCopychevron-down

1.  [Technical Specifications](/docs/technical-specifications)chevron-right
2.  [(Legacy) Pre-FAPI 2.0 API Specifications](/docs/technical-specifications/singpass-authentication-api)chevron-right
3.  [3\. Userinfo Endpoint](/docs/technical-specifications/singpass-authentication-api/3.-userinfo-endpoint)

# Requesting Userinfo

triangle-exclamation

All Login and Myinfo apps must follow Singpass' [FAPI 2.0-compliant authentication API](/docs/technical-specifications/integration-guide) by 31 Dec 2026.

The specifications on this page apply to you only if you are maintaining an existing Login / Myinfo (v5) integration. We encourage you to [migrate](/docs/technical-specifications/migration-guides/login-myinfo-v5-apps) early to avoid service disruptions.

Clients must present a valid access token (of type `Bearer`) to retrieve the UserInfo claims. This access token is produced from the [token endpoint](/docs/technical-specifications/singpass-authentication-api/2.-token-endpoint/authorization-code-grant#http-response). Only those claims that are scoped in the successful authentication request will be made available to the client.

Example request to get the `userinfo` claims:

Copy

```
GET /userinfo HTTP/1.1
Host: id.singpass.gov.sg
Authorization: Bearer eyJhbGciOiJFUzI1NiIsInR5cCI6ImF0K2p3dCIsImtpZCI6ImFsaWFzL3ByZC1zcC1hdXRoLWFwaS1pZC10b2tlbi1zaWduaW5nLWtleS1rbXMtYXN5bW1ldHJpYy1rZXktYWxpYXMifQ.eyJzdWIiOiJzPVM2NTAwMDEwRSx1PWIyMGVhNjRhLTc2OTQtNDQyZi04Njc0LTRjMDVkNmQ5NDdmZiIsImNsaWVudF9pZCI6Ik9RYnNHU0NUNWRzUEhmUWdGbGlieUZud1g0YUpXYWlaIiwic2NvcGUiOiJvcGVuaWQgdWluZmluIG5hbWUgYmlydGhjb3VudHJ5IGRpYWxlY3QgZG9iIGhhbnl1cGlueWlubmFtZSBuYXRpb25hbGl0eSBwYXNzcG9ydGV4cGlyeWRhdGUgcGFzc3BvcnRudW1iZXIgcmFjZSByZXNpZGVudGlhbHN0YXR1cyBzZWNvbmRhcnlyYWNlIHNleCIsImp0aSI6ImF0LWJRTmEtT2FveEdvdXh3TTFiSmtsTU5leFNvSjJLOXJOcGdFS0wyb0ptcEEiLCJpYXQiOjE3Mjg2MjIxMTksImV4cCI6MTcyODYyMzkxOSwiYXVkIjoiaHR0cHM6Ly9pZC5zaW5ncGFzcy5nb3Yuc2cvdXNlcmluZm8iLCJpc3MiOiJodHRwczovL2lkLnNpbmdwYXNzLmdvdi5zZyJ9.3KjEQKXEhc88e6mRCv6sIe4U-psd1Pe4hLp7hQCN6MQGcHNFHpL8lmJ3B-RAxeunb-HKAxQLfSWnzpu767EQYQ
```

Example response:

Copy

```
HTTP/1.1 200 OK
Content-Type: application/jwt;
eyJjdHkiOiJKV1QiLCJlbmMiOiJBMjU2Q0JDLUhTNTEyIiwiYWxnIjoiRUNESC1FUytBMjU2S1ciLCJraWQiOiJ0ZXN0LXJwLWtleS0wMSIsImVwayI6eyJrdHkiOiJFQyIsImNydiI6IlAtMjU2IiwieCI6IjZkWHpIbFBFT2d0c0ZCZlc0THRlNlV3a00taXk2NGJ0dkF2c0R2WTYtd00iLCJ5IjoiZDRTZkdrYnRiZ19lakhPZnJ6Ul9fU2R1b0tCYVluVHVKbU84Uk0zUWFENCJ9fQ.jZi6w7zl9Tbl0t-AucyVCIzoaztu6QAtvQh4eegdBQ5ekTRJBPhChtuaT0WLVRsWd7WFmiZA3R27VVs6ZoYZy2_Oq7-SfNpZ.FhY_KkI5FhrsEz-v77SrwQ.rGdyiIXNvn_pra6AW48V_zIR59C4qDVL0JdJ9lmz9OLmnepy4X2ZpfbvaU54NU6d94g9KjWRYUprqoFLBQJB2c1_87qfCT-phkluJOYX0nyEIHahYvqADmxd7wtu3KguYEz45EPa2mSLgYM6ieUsR0Mw5s9pUjPkl3TomSIeN-4K9ZebeyPbkygxiT7bX74o31ODqXRDED-2kqeTpuqs6Dx92sUV-HNhPDIVnYp7nJurqvh46mF4Zt83OuH3QDOVmQsQQxYUupE95vfRZae9cQx8ZMrGTC-GSXNAqv2Gd6q5V4n9FFBwsOvsn-Gwd6i3gxYKMYr8k4jRQ2ykBYtFWMryeBZQCBhHaZEpcbZFCgLaD5XvXmWjNwA1Qm_gkPBF6Luhm6wYgjURxCwA7FQx4sZkrNL5jZjTfRaW38GiBHnvTXEPdGFVzXwIohVVqCCFr7nrf1uQfq1UXKduZVrtcTLnX7v1-sVEhpFyGFCmDtKAtQSaLvg4IMDK7U943NgB3ddRjJK4PQuBtivexSBgJc_RRIKIBKIQJxI3WYId0-WxmDsMSzgCZ5iJWIfKqUEAbhImtK2vzcqNs8obgEeIfzZPYd9g977l0PgPiJzfoCBQDirxu-ftEOLlepT6YIMnetSbrs3y6bQDjdMBv-SDXHRwFT7qRZefdoUSV9yhsN52_U4P8W7u4l_uUJWZHZyhxgMDg7AluRBSPG2g4ti7I8B_3cYsEY9m4YYYMLlIhhM5cRg4KfJeoRH7UK9unkNeyGRjLLRLwisL3tQN1KsPdVeaAUYOuFKtaz-3U8lW3zprYdeJ0cNERiToczOjmpvv.PUNV3te9SF7OgGY8UFbIzTBJy7iJhBb4RDy9Kj5cuFc
```

circle-check

An access token can be re-used up to its validity period of thirty (30) minutes.

### 

[hashtag](#error-response)

**Error Response**

Singpass generally follows OIDC error response specifications. For more information, please refer to the [Userinfo error response specificationsarrow-up-right](https://openid.net/specs/openid-connect-core-1_0.html#UserInfoError).

* * *

**An access token is only valid for 30 minutes**.

Sending a request to the `/userinfo` endpoint beyond its lifetime will result in an `invalid_token` error:

Copy

```
HTTP/1.1 401 Unauthorized
Date: Wed, 09 Oct 2024 10:49:52 GMT
Content-Type: application/json; charset=utf-8

{"id":"afc64481-a01b-44c8-a716-52ef45c9c527","error":"invalid_token","error_description":"An error has occurred.","trace_id":"1-67065fd0-079db77d1f7a760e616f2271"}
```

[Previous3\. Userinfo Endpointchevron-left](/docs/technical-specifications/singpass-authentication-api/3.-userinfo-endpoint)[NextValidating the payloadchevron-right](/docs/technical-specifications/singpass-authentication-api/3.-userinfo-endpoint/validating-the-payload)

Last updated 24 days ago

Was this helpful?