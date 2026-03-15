# Contract: Singpass Userinfo Endpoint

## Endpoint
`GET /userinfo`

## Request
### Headers
- `Authorization`: `DPoP <access_token>`
- `DPoP`: The DPoP proof JWT.

## Response
### Success (200 OK)
**Content-Type**: `application/jwt`

The response body is a compact JWE string (encrypted JWS) containing the `person_info` object in its payload.

#### Decrypted Payload Structure
```json
{
  "sub": "S1234567A",
  "iss": "https://<identity-provider-url>",
  "aud": "<client_id>",
  "iat": 1710500000,
  "person_info": {
    "uinfin": {
      "value": "S1234567A"
    },
    "name": {
      "value": "JOHN DOE"
    },
    "sex": {
      "value": "M"
    },
    "residentialstatus": {
      "value": "C"
    },
    "nationality": {
      "value": "SG"
    },
    "dob": {
      "value": "1990-01-01"
    },
    "email": {
      "value": "johndoe@example.com"
    },
    "mobileno": {
      "prefix": {
        "value": "+"
      },
      "areacode": {
        "value": "65"
      },
      "nbr": {
        "value": "91234567"
      }
    },
    "passportnumber": null, 
    "...": "Other fields based on requested scopes..."
  }
}
```

*Note: Missing catalog fields must be explicitly returned as `null`.*

### Error (401 Unauthorized)
**Headers**: `WWW-Authenticate: DPoP error="invalid_token"` (or other standard OIDC error)
**Content-Type**: `application/json`

```json
{
  "error": "invalid_token",
  "error_description": "The access token expired"
}
```