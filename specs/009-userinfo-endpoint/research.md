# Research: UserInfo Endpoint

## DPoP Validation with `jose`

**Decision**: Use existing `JoseCryptoService.validateDPoPProof` and perform manual `jkt` binding check in the use case.

**Rationale**:
- `JoseCryptoService` already implements RFC 9449 validation (htm, htu, jti uniqueness, iat).
- The use case will retrieve the access token, extract `cnf.jkt`, and verify it matches the thumbprint of the public key in the DPoP proof.

**Alternatives Considered**:
- Middleware-based DPoP validation: Rejected because binding check requires access to the token payload, which is better handled in the application layer (use case).

## Nested JWS-in-JWE Implementation

**Decision**: Implement a two-step process using `jose.SignJWT` and `jose.CompactEncrypt`.

**Rationale**:
- `jose.SignJWT` creates the JWS.
- `jose.CompactEncrypt` is required for the outer JWE because the payload is a string (the JWS), not a JSON object.
- Algorithms: ES256 for JWS, ECDH-ES+A256KW (alg) and A256GCM (enc) for JWE.

**Implementation Pattern**:
```typescript
const jws = await new jose.SignJWT(payload)
  .setProtectedHeader({ alg: 'ES256', kid: serverKid })
  .setIssuedAt()
  .sign(serverPrivateKey);

const jwe = await new jose.CompactEncrypt(new TextEncoder().encode(jws))
  .setProtectedHeader({ 
    alg: 'ECDH-ES+A256KW', 
    enc: 'A256GCM', 
    kid: clientKid 
  })
  .encrypt(clientPublicKey);
```

## Database Schema & `person_info` Mapping

**Decision**: Map `users` table fields to a nested `person_info` structure.

**Rationale**:
- Current `users` table: `id` (UUID), `nric`, `name`, `email`.
- Mapping:
  - `sub` -> `users.id`
  - `person_info.uinfin` -> `users.nric`
  - `person_info.name` -> `users.name`
  - `person_info.email` -> `users.email`
- Values will be wrapped in `{ value: string }` objects to match Myinfo/Singpass standards if specified, or returned as flat values within the nested object. The spec says "follows the Myinfo Get Person response", which uses the `{ value: ... }` pattern.

**Data Retrieval**:
- Access token identifies the `userId`.
- Use Case will join `access_tokens` with `users` to fetch claims.
- Scopes (`openid`, `uinfin`, `name`, `email`) will filter which fields are included in `person_info`.

## Dependencies & Best Practices

- **Library**: `jose` is the standard for JWT/JWE in the Bun/JS ecosystem and already used in the project.
- **Security**: DPoP prevents token theft/replay. JWE ensures confidentiality. ES256 provides strong, efficient signatures.
