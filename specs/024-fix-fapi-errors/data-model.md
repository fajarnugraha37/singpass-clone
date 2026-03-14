# Data Model

**Feature**: Fix FAPI Error Types
**Branch**: `024-fix-fapi-errors`
**Spec**: [spec.md](./spec.md)

## FapiErrorResponse

This entity represents a standard error response from the token endpoint, aligned with both OAuth 2.0 and the specific Singpass FAPI profile.

**Fields**:

| Field             | Type   | Description                                                                                             | Required |
|-------------------|--------|---------------------------------------------------------------------------------------------------------|----------|
| `error`           | String | A single ASCII error code. This will now include `server_error`, `temporarily_unavailable`, `invalid_token`. | Yes      |
| `error_description` | String | Human-readable ASCII text providing additional information, used to assist the client developer in understanding the error that occurred. | No       |

**Validation Rules**:

- The `error` field MUST be one of the values defined in the `tokenErrorResponseSchema`.
- The `error_description` field, if present, MUST NOT include characters outside the set of ASCII printable characters.

**State Transitions**:

- This is a terminal entity and does not have state transitions. It is created and returned when an error condition is met.
