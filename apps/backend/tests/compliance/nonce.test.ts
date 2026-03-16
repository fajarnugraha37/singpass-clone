import { describe, expect, it } from 'bun:test';
import { validateNonce } from '../../src/core/auth/validation';

describe('Singpass OIDC Compliance: Nonce Validation', () => {
  it('SHOULD accept a valid high-entropy nonce', () => {
    const validNonce = 'n-0S6_WzA2Mj';
    expect(validateNonce(validNonce)).toBe(true);
  });

  it('SHOULD reject a short nonce', () => {
    const shortNonce = 'abc';
    expect(validateNonce(shortNonce)).toBe(false);
  });

  it('SHOULD reject an empty nonce', () => {
    expect(validateNonce('')).toBe(false);
  });
});
