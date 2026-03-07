copyCopychevron-down

1.  [Technical Specifications](/docs/technical-specifications)chevron-right
2.  [(Legacy) Pre-FAPI 2.0 API Specifications](/docs/technical-specifications/singpass-authentication-api)

# Error Response

triangle-exclamation

All Login and Myinfo apps must follow Singpass' [FAPI 2.0-compliant authentication API](/docs/technical-specifications/integration-guide) by 31 Dec 2026.

The specifications on this page apply to you only if you are maintaining an existing Login / Myinfo (v5) integration. We encourage you to [migrate](/docs/technical-specifications/migration-guides/login-myinfo-v5-apps) early to avoid service disruptions.

Singpass APIs are RESTful in design and communicate classes of errors based on the **HTTP status code**. The status code should be used to determine if the error is caused by consumer or provider. Consumers should log the HTTP status code along with the `id` and/or `trace_id` of the error.

HTTP Status

Description

4xx

Errors caused by API consumer. You can expect codes such as 400, 401, 403, 404 etc. if incorrect requests are made to APIs.

Example: **400 Bad Request due to invalid/missing request arguments**

5xx

Errors caused by API provider or its dependencies. You can expect codes such as 500, 502, 503 etc if there is an issue on Singpass or its dependencies.

Example: **500: Internal Server Error due to some kind of programming error.**

Example: Invalid Request Parameters

Copy

```
HTTP/1.1 400 Bad Request
Connection: keep-alive
Cache-Control: no-cache, no-store, must-revalidate
Transfer-Encoding: chunked
Content-Type: application/json
Date: Thu, 26 Sep 2024 03:36:41 GMT
Content-Length: 190

{
  "id" : "bcba4bc3-534e-4891-bfa2-e872b4502d80",
  "error" : "CLIENT_SIDE_ERROR",
  "error_description" : "This is an invalid request.",
  "trace_id" : "66f4d6c93a23476106150eb7c40d7dc9"
}
```

Example: Server Error

Path

Type

Description

`id`

`String`

The unique identifier for this error/request. Please log this identifier for support and debugging purposes.

`trace_id`

`String InstanceOfAssertFactory`

(Optional) An auxiliary id for request correlation across services. Please also log this identifier for operational support and debugging purposes.

`error`

`String`

Error code representing broad class of error; likely to be one of CLIENT\_SIDE\_ERROR, ARGUMENTS\_NOT\_VALID, SERVER\_SIDE\_ERROR, TOO\_MANY\_REQUESTS. However, specific error codes can be returned for some endpoints, in which case you may find more details in the documentation for that endpoint.

`error_description`

`String`

Returns human readable general information about the reason for the error. Note that due to security reasons; detailed information is unlikely to be available in this message.

[PreviousJWKS Endpointchevron-left](/docs/technical-specifications/singpass-authentication-api/.well-known-endpoints/jwks-endpoint)[NextPricingchevron-right](/docs/pricing/pricing)

Last updated 24 days ago

Was this helpful?