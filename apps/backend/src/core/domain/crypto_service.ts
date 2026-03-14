import type { JWK, KeyLike } from 'jose';

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
   * Generates a nested JWS-in-JWE (Signed then Encrypted) payload.
   * Signs the payload with the server private key (ES256).
   * Encrypts the JWS string with the client public encryption key (ECDH-ES+A256KW).
   */
  signAndEncrypt(
    payload: Record<string, any>,
    clientPublicKey: JWK,
    serverKeyId?: string
  ): Promise<string>;

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
   * Checks signature, iat, jti, htm, htu, and optionally nonce.
   */
  validateDPoPProof(
    proof: string,
    expectedMethod: string,
    expectedUrl: string,
    clientId: string,
    expectedNonce?: string
  ): Promise<{ jkt: string }>;

  /**
   * Generates a new DPoP-Nonce for a client.
   */
  generateDPoPNonce(clientId: string): Promise<string>;

  /**
   * Validates a DPoP-Nonce.
   */
  validateDPoPNonce(nonce: string, clientId: string): Promise<boolean>;

  /**
   * Generates the public JWKS (JSON Web Key Set) for the server.
   */
  getPublicJWKS(): Promise<{ keys: JWK[] }>;

  /**
   * Calculates the S256 thumbprint (jkt) of a JWK.
   */
  calculateThumbprint(jwk: JWK): Promise<string>;

  /**
   * Validates exact redirect_uri against client registry.
   */
  validateRedirectUri(clientId: string, redirectUri: string): Promise<boolean>;

  /**
   * Returns an active server key for signing or encryption.
   */
  getActiveKey(): Promise<{ id: string; privateKey: KeyLike; publicKey: JWK }>;
}
