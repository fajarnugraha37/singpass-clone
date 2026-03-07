import type { JWK } from 'jose';

export interface CryptoService {
  /**
   * Generates a new ES256 key pair.
   * Returns the private key (Buffer/Uint8Array) and the public key (JWK format).
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
