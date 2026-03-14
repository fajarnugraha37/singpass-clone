# Authorization Contracts: PAR Request Update

## Updated `parRequestSchema`

The `parRequestSchema` (located in `packages/shared/src/config.ts`) MUST accept the following new fields in the POST body of the `/api/par` request.

| Parameter | Type | Mandatory | Description |
|-----------|------|-----------|-------------|
| `authentication_context_type` | `string` | Optional* | Must match a valid Singpass enum value. |
| `authentication_context_message` | `string` | No | Optional message, max 100 characters. |

*\* Mandatory if the client is configured as a "Login" application.*

### Example Request Body (Login App)
```json
{
  "response_type": "code",
  "client_id": "login-app-1",
  "scope": "openid",
  "state": "random-state",
  "nonce": "random-nonce",
  "redirect_uri": "https://client.example.com/cb",
  "code_challenge": "challenge-base64",
  "code_challenge_method": "S256",
  "client_assertion_type": "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
  "client_assertion": "ey...jwt",
  "authentication_context_type": "APP_AUTHENTICATION_DEFAULT",
  "authentication_context_message": "Authorize login to Vibe Auth"
}
```

### Response on Validation Failure (400 Bad Request)
```json
{
  "error": "invalid_request",
  "error_description": "authentication_context_type is mandatory for Login apps"
}
```

## Error Descriptions

- **Missing Context Type**: `authentication_context_type is mandatory for Login apps`.
- **Invalid Context Type**: `authentication_context_type must be a valid Singpass enum`.
- **Invalid Context Message**: `authentication_context_message exceeds 100 characters or contains invalid characters`.
- **Forbidden Context**: `authentication_context parameters are only allowed for Login apps`.
