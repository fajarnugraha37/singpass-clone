# Contract: UserInfo Response

**Endpoint**: `GET /userinfo`  
**Content-Type**: `application/jwt` (Signed then Encrypted)

## Decrypted Payload Structure

```json
{
  "sub": "7c9c72ec-5be2-495a-a78e-61e809a2a236",
  "iss": "https://localhost",
  "aud": "test-client",
  "iat": 1710400000,
  "acr": "urn:singpass:authentication:loa:2",
  "amr": ["pwd", "otp-sms"],
  "sub_type": "user",
  "person_info": {
    "uinfin": { "value": "S1234567A" },
    "name": { "value": "JOHN DOE" },
    "email": { "value": "john@example.com" },
    "mobileno": { "value": "91234567" }
  }
}
```

## Field Definitions

| Field | Requirement | Description |
|-------|-------------|-------------|
| `sub` | REQUIRED | The unique identifier for the user (UUID) |
| `iss` | REQUIRED | The issuer URI |
| `aud` | REQUIRED | The client ID |
| `iat` | REQUIRED | Issued at timestamp |
| `acr` | REQUIRED | Authentication Context Class Reference (LOA) |
| `amr` | REQUIRED | Authentication Method Reference (Array) |
| `sub_type` | REQUIRED | Fixed value: `"user"` |
| `person_info` | REQUIRED | Object containing nested claims based on authorized scopes. |

## person_info Attributes

Each attribute in `person_info` is a JSON object with a `value` field.

| Scope | Attribute | Description |
|-------|-----------|-------------|
| `uinfin` | `uinfin` | National identifier (NRIC/FIN) |
| `name` | `name` | Full name |
| `email` | `email` | Verified email address |
| `mobileno` | `mobileno` | Verified mobile number |
