# Contract: ID Token (JWS-in-JWE)

## Overview
The ID Token is a signed JWT (JWS) nested within an encrypted JWT (JWE). This contract defines the payload of the inner JWS.

## JWS Payload Structure

```json
{
  "iss": "https://idp.vibe-auth.local",
  "sub": "user_12345",
  "aud": "client_abcde",
  "iat": 1710500000,
  "exp": 1710503600,
  "nonce": "optional_nonce_value",
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
| `iss` | string | Issuer Identifier. | Yes |
| `sub` | string | Subject Identifier (User ID). | Yes |
| `aud` | string | Audience (Client ID). | Yes |
| `iat` | number | Issued At (Unix timestamp). | Yes |
| `exp` | number | Expiration Time (Unix timestamp). | Yes |
| `nonce` | string | Nonce to associate client session with ID Token. | Optional |
| `acr` | string | Authentication Context Class Reference (LOA). | Yes |
| `amr` | string[] | Authentication Methods References. | Yes |
| `sub_type` | string | Subject type, always "user". | Yes |
| `sub_attributes` | object | Container for identity/profile attributes. | Conditional |

## `sub_attributes` Inclusion Logic
- Omit `sub_attributes` if no identity/profile scopes are authorized.
- Fields within `sub_attributes` are only included if the corresponding scope is authorized:
  - `user.identity` -> `identity_number`, `identity_coi`, `account_type`.
  - `name` -> `name`.
  - `email` -> `email`.
  - `mobileno` -> `mobileno`.
