import { describe, expect, it } from 'bun:test';
import { validatePKCE } from '../../src/core/utils/pkce';

describe('Singpass OIDC Compliance: PKCE', () => {
  const verifier = 'th7S6_WzA2MjkwMTIzNDU2Nzg5MDEyMzQ1Njc4OTA';
  // challenge for 'th7S6_WzA2MjkwMTIzNDU2Nzg5MDEyMzQ1Njc4OTA' using S256
  const challenge = 'nxae_NX_UX_X_X_X_X_X_X_X_X_X_X_X_X_X_X_X'; // This is a placeholder, I'll calculate real one

  it('SHOULD reject token exchange if code_verifier is invalid (mismatch)', async () => {
    const invalidVerifier = 'wrong-verifier';
    const isValid = await validatePKCE(invalidVerifier, 'any-challenge');
    expect(isValid).toBe(false);
  });

  it('SHOULD accept token exchange if code_verifier is valid', async () => {
    // Verifier: 'test'
    // SHA256: 'n4bQgYhMfWWaL+qgxVrQFaO/TxsrC4Is0V1sFbDwCgg='
    // Base64url: 'n4bQgYhMfWWaL-qgxVrQFaO_TxsrC4Is0V1sFbDwCgg'
    const testVerifier = 'test';
    const testChallenge = 'n4bQgYhMfWWaL-qgxVrQFaO_TxsrC4Is0V1sFbDwCgg';
    
    const isValid = await validatePKCE(testVerifier, testChallenge, 'S256');
    expect(isValid).toBe(true);
  });

  it('SHOULD reject if method is NOT S256', async () => {
    const isValid = await validatePKCE('any', 'any', 'plain');
    expect(isValid).toBe(false);
  });
});
