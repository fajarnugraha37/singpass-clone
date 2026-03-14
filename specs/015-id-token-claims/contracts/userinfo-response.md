# Contract: UserInfo Response (JWS-in-JWE)

## Overview
The UserInfo response is a signed JWT (JWS) nested within an encrypted JWT (JWE). This contract defines the payload of the inner JWS.

## JWS Payload Structure

```json
{
  "sub": "user_12345",
  "acr": "urn:singpass:authentication:loa:2",
  "amr": ["pwd", "otp-sms"],
  "sub_type": "user",
  "sub_attributes": {
    "identity_number": "S1234567A",
    "identity_coi": "SG",
    "account_type": "standard",
    "name": "Tan Ah Kow",
    "email": "tan@example.com",
    "mobileno": "81234567"
  }
}
```

## Field Definitions

| Claim | Type | Description | Required |
|-------|------|-------------|----------|
| `sub` | string | Subject Identifier (User ID). | Yes |
| `acr` | string | Authentication Context Class Reference (LOA). | Yes |
| `amr` | string[] | Authentication Methods References. | Yes |
| `sub_type` | string | Subject type, always "user". | Yes |
| `sub_attributes` | object | Container for identity/profile attributes. | Conditional |

## `sub_attributes` Inclusion Logic
- Omit `sub_attributes` if no identity/profile scopes were authorized for the access token.
- Fields within `sub_attributes` are only included if the corresponding scope was authorized:
  - `user.identity` -> `identity_number`, `identity_coi`, `account_type`.
  - `name` -> `name`.
  - `email` -> `email`.
  - `mobileno` -> `mobileno`.
