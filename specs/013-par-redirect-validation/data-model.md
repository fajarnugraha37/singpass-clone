# Data Model: PAR `redirect_uri` Registration Validation

## Entities

### ClientConfig (Domain Model)
The existing `ClientConfig` entity remains the source of truth for registered client data.

- **`clientId`**: (string, Unique)
- **`redirectUris`**: (string[], Required) List of pre-authorized redirection URIs.

### PushedAuthorizationRequest (Transient)
The incoming request payload must contain the `redirect_uri`.

- **`redirect_uri`**: (string, URL format) The URI to be validated against the `ClientConfig.redirectUris`.

## Validation Rules

1. **Mandatory Presence**: `redirect_uri` MUST exist in the payload.
2. **Registry Existence**: The client MUST be registered in the `ClientRegistry`.
3. **Exact Match**: The incoming `redirect_uri` MUST exactly match one of the entries in `ClientConfig.redirectUris` (string equals).
4. **Empty Registry**: If the `ClientConfig.redirectUris` list is empty, all `redirect_uri` values are rejected.
