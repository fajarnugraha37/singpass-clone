# Research: UserInfo `WWW-Authenticate` Headers

## Decisions

### Decision 1: Controller-level Error Handling for `WWW-Authenticate`
The `WWW-Authenticate` header will be added directly in the `userinfo.controller.ts` where HTTP-specific response logic resides.

- **Rationale**: The controller is the adapter layer responsible for HTTP semantics. The use case should remain agnostic of specific HTTP headers, even if it throws semantically correct errors.
- **Alternatives Considered**: 
  - Adding headers in a middleware (Rejected: UserInfo specific error logic is cleaner in the controller).
  - Returning headers from the use case (Rejected: Violates Hexagonal Architecture by leaking HTTP concerns into the core).

### Decision 2: Error Code Mapping
We will use the following mapping for the `error` parameter in the `WWW-Authenticate` header:

- `invalid_token`: When the access token is missing, expired, or invalid.
- `invalid_dpop_proof`: When the DPoP proof is missing or fails validation.
- `invalid_request`: When the request is otherwise malformed (e.g., wrong scheme).

- **Rationale**: Aligns with RFC 9449 Section 11.2 and the Singpass Integration Guide.

## Rationale Summary
Compliance with Singpass and FAPI 2.0 (via DPoP) requires that resource servers (like the UserInfo endpoint) provide specific challenges in 401 responses to guide clients on how to correct authentication failures.

## Reference
- **RFC 9449 (DPoP)** Section 11.2 (Resource Server Challenges)
- **Singpass Integration Guide**: "These parameters will also be returned in the `WWW-Authenticate` header."
