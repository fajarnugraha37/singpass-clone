import { createHash } from 'node:crypto';

/**
 * Validates a PKCE code_verifier against a code_challenge as per RFC 7636.
 */
export async function validatePKCE(verifier: string, challenge: string, method: string = 'S256'): Promise<boolean> {
  if (method !== 'S256') {
    // Only S256 is supported for FAPI 2.0
    return false;
  }

  try {
    const hash = createHash('sha256').update(verifier).digest();
    const challengeFromVerifier = hash.toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    return challengeFromVerifier === challenge;
  } catch (err) {
    console.error('PKCE Validation Error:', err);
    return false;
  }
}
