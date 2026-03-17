# Quickstart: Testing Singpass Compliance Fixes

This quickstart provides instructions on how to test the newly implemented compliance and security hardening features.

## 1. Prerequisites

- A running instance of the `vibe-auth` backend application.
- A tool capable of making HTTP requests (e.g., `curl`, Postman, or a custom script).
- An OIDC client or test script capable of generating DPoP proofs and client assertions.

## 2. Testing Procedures

### 2.1. Test DPoP `exp` Validation

1.  Generate a DPoP proof with an `iat` claim and an `exp` claim that is more than 2 minutes greater than `iat`.
2.  Attempt to make a request to the Userinfo endpoint using this DPoP proof.
3.  **Expected Result**: The server should reject the request with a `401 Unauthorized` error, indicating an invalid DPoP proof.

### 2.2. Test DPoP `ath` Validation

1.  Obtain a valid access token.
2.  Generate a DPoP proof for a Userinfo request but **omit** the `ath` claim.
3.  Make a request to the Userinfo endpoint.
4.  **Expected Result**: The server should reject the request with a `401 Unauthorized` error.
5.  Generate another DPoP proof with an **incorrect** `ath` claim (e.g., hash of a different string).
6.  Make a request to the Userinfo endpoint.
7.  **Expected Result**: The server should reject the request with a `401 Unauthorized` error.

### 2.3. Test Server JWKS for Encryption Key

1.  Make a `GET` request to the `/jwks` endpoint.
2.  **Expected Result**: The response should be a JSON object containing a `keys` array. This array must contain at least one key object with `"use": "enc"`.

### 2.4. Test Client Assertion Validations

1.  **`iss` != `sub`**: Generate a client assertion where the `iss` and `sub` claims have different values. Attempt to use it at the `/token` endpoint.
    -   **Expected Result**: The server should reject the request.
2.  **Invalid `aud`**: Generate a client assertion with an `aud` claim that does not match the server's issuer identifier.
    -   **Expected Result**: The server should reject the request.
3.  **Long `exp`**: Generate a client assertion where `exp` is more than 2 minutes after `iat`.
    -   **Expected Result**: The server should reject the request.
4.  **`jti` Replay**: Successfully use a client assertion at the `/token` endpoint. Immediately attempt to use the *same* assertion again.
    -   **Expected Result**: The server should reject the second request as a replay attack.

### 2.5. Test PKCE `code_verifier` Constraints

1.  **Short Verifier**: Attempt a token exchange with a `code_verifier` that is less than 43 characters long.
    -   **Expected Result**: The server should reject the request with a `400 Bad Request` validation error.
2.  **Long Verifier**: Attempt a token exchange with a `code_verifier` that is more than 128 characters long.
    -   **Expected Result**: The server should reject the request with a `400 Bad Request` validation error.
3.  **Invalid Characters**: Attempt a token exchange with a `code_verifier` containing invalid characters (e.g., `!`, `@`, `+`).
    -   **Expected Result**: The server should reject the request with a `400 Bad Request` validation error.

### 2.6. Test OIDC Discovery Metadata

1.  Make a `GET` request to `/.well-known/openid-configuration`.
2.  **Expected Result**: The JSON response should contain the fields `id_token_encryption_alg_values_supported`, `id_token_encryption_enc_values_supported`, `userinfo_encryption_alg_values_supported`, and `userinfo_encryption_enc_values_supported`.
