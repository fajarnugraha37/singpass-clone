# Contract: ID Token Response

**Format**: `application/jwt` (Signed then Encrypted)

## Decoded Payload Structure

```json
{
  "sub": "7c9c72ec-5be2-495a-a78e-61e809a2a236",
  "aud": "test-client",
  "acr": "urn:singpass:authentication:loa:2",
  "amr": ["pwd", "otp-sms"],
  "sub_type": "user",
  "sub_attributes": {
    "identity_number": "S1234567A",
    "identity_coi": "SG",
    "account_type": "standard",
    "name": "JOHN DOE",
    "email": "john@example.com",
    "mobileno": "91234567"
  },
  "iss": "https://localhost",
  "exp": 1710403600,
  "iat": 1710400000,
  "nonce": "WjqUMMmOevYOXmwC27mcAQWsFBn3O7wwhbRItl2FJk8"
}
```

## sub_attributes Definitions

| Field | Requirement | Scope | Description |
|-------|-------------|-------|-------------|
| `identity_number` | OPTIONAL | `user.identity` | User's NRIC/FIN |
| `identity_coi` | REQUIRED | `user.identity` | Fixed to `"SG"` (if `user.identity` scope is authorized) |
| `account_type` | REQUIRED | `user.identity` | Fixed to `"standard"` (if `user.identity` scope is authorized) |
| `name` | OPTIONAL | `name` | User's full name |
| `email` | OPTIONAL | `email` | User's verified email address |
| `mobileno` | OPTIONAL | `mobileno` | User's verified mobile number |

## Rules

- `sub_attributes` MUST be omitted entirely if none of the relevant scopes are authorized.
- Fields MUST be omitted if the value is missing in the verified identity store.
- `identity_coi` and `account_type` MUST be included if `user.identity` scope is authorized, even if `identity_number` is missing.
