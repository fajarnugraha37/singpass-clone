import { createHash, randomBytes } from 'node:crypto';

/**
 * Generates a PKCE code_verifier and code_challenge as per RFC 7636.
 */
export function generatePKCE(): { verifier: string; challenge: string } {
  const verifier = randomBytes(32).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  return { verifier, challenge };
}

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
