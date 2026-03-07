# Client Implementation: Parsing the ID Token

## Overview
The `id_token` returned by the Singpass Token endpoint is a highly secure Nested JWT: it is a JSON Web Signature (JWS) nested inside a JSON Web Encryption (JWE). 

## Steps to Parse and Validate

### 1. Decrypt the JWE
The outermost layer of the `id_token` is encrypted using the client's public encryption key (registered with Singpass).
- Use your client's Private Encryption Key to decrypt the payload.
- Ensure your JWT library supports JWE decryption (e.g., `A256CBC-HS512` or `A256GCM` algorithms).

### 2. Verify the JWS Signature
Once decrypted, the payload is a signed JWS.
- Fetch Singpass's public keys from their `jwks_uri`.
- Verify the signature of the JWS using the Singpass public key that matches the `kid` in the JWS header.

### 3. Validate the Claims
After successfully verifying the signature, decode the JSON payload and perform the following mandatory FAPI 2.0 checks:
1. **Issuer (`iss`)**: Must exactly match the Singpass `issuer` identifier from the discovery endpoint.
2. **Audience (`aud`)**: Must exactly match your app's `client_id`.
3. **Expiration (`exp`)**: The current time must be strictly before the `exp` timestamp.
4. **Nonce (`nonce`)**: Must exactly match the `nonce` value you generated and saved in the user's session during the PAR step.

### 4. Extract User Data
If validation is successful, the `id_token` is authentic.
- Extract the `sub` claim (the unique user identifier).
- If you requested scopes like `name` or `user.identity`, extract data from the `sub_attributes` object.
- Extract the `acr` (Authentication Class Reference) to verify the Level of Assurance (e.g., `urn:singpass:authentication:loa:2` for 2FA).
- Extract the `amr` array to see which form factors were used (e.g., `["pwd", "otp-sms"]`).

Log the user into your application based on this validated identity.
