# Feature Specification: Remediate Singpass Compliance Audit Findings

## 1. Introduction

This document outlines the requirements for remediating the findings from the Singpass Compliance Audit Report. The goal is to harden the `vibe-auth` implementation to ensure it is secure, robust, and fully compliant with Singpass technical specifications.

## 2. User Stories

- **As a security auditor,** I want the system to pass all technical compliance checks to ensure it is secure and robust against known vulnerabilities.
- **As a developer,** I want the mock server to enforce the same strict rules as the production Singpass environment to catch integration issues early in the development cycle.

## 3. Functional Requirements

### 3.1. DPoP Validation

- The `DPoPValidator` must validate the `exp` (expiration) claim in the DPoP proof, ensuring it is no more than 2 minutes after the `iat` (issued at) claim.
- The `DPoPValidator` must validate the `ath` (access token hash) claim for all Userinfo requests. The validator will accept the access token, compute the expected hash, and verify it against the `ath` claim in the DPoP proof.

### 3.2. Server JWKS

- The server's public JSON Web Key Set (JWKS), available at the `/jwks` endpoint, must be updated to include at least one encryption key (a key with `use: enc`).

### 3.3. Client Assertion Validation

- The `JoseCryptoService` must enforce that the `sub` (subject) claim in a client assertion is identical to the `iss` (issuer) claim.
- The service must validate that the `aud` (audience) claim matches the configured Singpass issuer identifier.
- The service must enforce that the `exp` (expiration) claim is no more than 2 minutes after the `iat` (issued at) claim.
- The Token Exchange endpoint must validate the `jti` (JWT ID) claim in the client assertion to prevent replay attacks. This check must be consistent with the replay prevention already implemented at the PAR endpoint.

### 3.4. PKCE Constraints

- The Token Exchange endpoint's validation schema must be updated to enforce that the `code_verifier` has a length between 43 and 128 characters.
- The validation schema must also enforce that the `code_verifier` only contains unreserved characters (`[A-Za-z0-9\-\._~]`).

### 3.5. OIDC Discovery

- The OIDC discovery document, available at `/.well-known/openid-configuration`, must be updated to include metadata for supported encryption algorithms. This includes `id_token_encryption_alg_values_supported`, `id_token_encryption_enc_values_supported`, `userinfo_encryption_alg_values_supported`, and `userinfo_encryption_enc_values_supported`.

## 4. Success Criteria

- The system correctly rejects DPoP proofs where the `exp` claim is more than 2 minutes after the `iat` claim.
- The system correctly rejects Userinfo requests if the DPoP proof is missing a valid `ath` claim.
- The public `/jwks` endpoint's response contains at least one key with `use: "enc"`.
- The system rejects client assertions where the `sub` claim does not match the `iss` claim.
- The system rejects client assertions where the `aud` claim does not match the expected Singpass issuer.
- The system rejects client assertions where the `exp` claim is more than 2 minutes greater than the `iat` claim.
- The system successfully prevents replayed client assertions at the token endpoint by tracking the `jti`.
- The system rejects token requests where the `code_verifier` is shorter than 43 characters, longer than 128 characters, or contains invalid characters.
- The OIDC discovery document at `/.well-known/openid-configuration` includes the required encryption algorithm metadata fields.

## 5. Assumptions

- The findings and recommendations in the provided audit report are accurate and represent the complete scope of work for this feature.
- The existing infrastructure for JTI replay prevention (`PARRepository`) can be reused or adapted for the token endpoint.
- The required encryption algorithms to be advertised in the OIDC discovery document are already supported by the underlying crypto library.

## 6. Out of Scope

- Any compliance findings not explicitly mentioned in the provided audit report.
- Any changes to the frontend application (`apps/frontend`).
- Performance optimization of the new validation logic.

## 7. Key Entities

- **DPoP Proof:** A JSON Web Token (JWT) used to demonstrate proof of possession.
- **Client Assertion:** A JWT used by a client to authenticate to the authorization server.
- **JWKS (JSON Web Key Set):** A set of cryptographic keys exposed by the server.
- **OIDC Discovery Document:** A JSON document that provides metadata about the OIDC server's configuration.
