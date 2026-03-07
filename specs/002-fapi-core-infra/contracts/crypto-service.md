# Contract: CryptoService

The `CryptoService` handles all cryptographic operations required by FAPI 2.0, including ES256 signing, JWKS generation, and DPoP/JWT validation.

## Interface Definition

```typescript
export interface CryptoService {
  /**
   * Generates a new ES256 key pair.
   * Returns the private key (encrypted) and the public key (JWK format).
   */
  generateKeyPair(): Promise<{
    id: string;
    privateKey: Uint8Array;
    publicKey: JWK;
  }>;

  /**
   * Signs a payload (e.g., ID Token) using an active server private key.
   */
  sign(payload: Record<string, any>, keyId?: string): Promise<string>;

  /**
   * Validates a client_assertion (private_key_jwt).
   * Verifies the signature against the client's registered public key.
   */
  validateClientAssertion(
    assertion: string, 
    clientPublicKey: JWK
  ): Promise<boolean>;

  /**
   * Validates a DPoP proof JWT.
   * Checks signature, iat, jti, htm, and htu.
   */
  validateDPoPProof(
    proof: string, 
    expectedMethod: string, 
    expectedUrl: string
  ): Promise<{ jkt: string }>;

  /**
   * Generates the public JWKS (JSON Web Key Set) for the server.
   */
  getPublicJWKS(): Promise<{ keys: JWK[] }>;

  /**
   * Calculates the S256 thumbprint (jkt) of a JWK.
   */
  calculateThumbprint(jwk: JWK): Promise<string>;
}
```

## Security Constraints

- **Algorithm**: MUST use `ES256`.
- **DPoP Freshness**: MUST enforce 60s TTL (configurable).
- **JTI Uniqueness**: MUST check if `jti` has been used within the window.
- **Key Storage**: Private keys MUST be handled as `Uint8Array` or secure buffers, NEVER as plain strings in logs.
