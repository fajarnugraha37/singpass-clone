import { getSigningKey } from '../security/jwt_utils';
import { signIDToken, IDTokenClaims, encryptIDToken } from '../utils/crypto';
import type { JWK } from 'jose';

/**
 * Hardened ID Token Issuer.
 * Specifically designed to handle Singpass-compliant nested JWTs (Signed then Encrypted).
 * Retreives signing keys from environment variables.
 */
export class TokenIssuer {
  /**
   * Generates a Singpass-compliant ID Token.
   * Signs with the server's private key (retrieved from ENV) and encrypts with client's public key.
   */
  async issueIdToken(
    payload: IDTokenClaims,
    clientPublicKey: JWK
  ): Promise<string> {
    // 1. Get signing key from Environment Variables via jwt_utils
    const { key, kid } = await getSigningKey();

    // 2. Sign (JWS)
    const signedJwt = await signIDToken(payload, key, kid, 'ES256');

    // 3. Encrypt (JWE)
    // Per Singpass: ECDH-ES+A256KW for key wrap, A256GCM for content encryption.
    return await encryptIDToken(signedJwt, clientPublicKey, 'ECDH-ES+A256KW', 'A256GCM');
  }
}
