# Contract: Token Endpoint

- **Endpoint**: `/token`
- **Method**: `POST`
- **Description**: Exchanges an authorization code for an access token.

## Request Body (`application/x-www-form-urlencoded`)

The `code_verifier` parameter will have stricter validation applied.

| Parameter       | Type   | Description                                                                                             | Constraints                                 |
| --------------- | ------ | ------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `grant_type`    | string | Must be `authorization_code`.                                                                           | Required                                    |
| `code`          | string | The authorization code received from the authorization endpoint.                                        | Required                                    |
| `redirect_uri`  | string | The same redirect URI that was used in the authorization request.                                       | Required                                    |
| `client_id`     | string | The client's identifier.                                                                                | Required                                    |
| `client_assertion`| string | A JWT used to authenticate the client.                                                                 | Required, must follow strict validation rules. |
| `client_assertion_type` | string | Must be `urn:ietf:params:oauth:client-assertion-type:jwt-bearer`.                                    | Required                                    |
| `code_verifier` | string | The PKCE code verifier.                                                                                 | Required, `string`, `min: 43`, `max: 128`, `regex: ^[A-Za-z0-9\-\._~]+$` |
