import { expect, test, describe } from 'bun:test'
import { validateRedirectUri, validateState, validateNonce } from '../../../src/core/auth/validation'

describe('Auth Validation Utilities', () => {
  describe('validateRedirectUri', () => {
    const registered = ['https://app.com/callback', 'https://app.com/auth'];

    test('should return true for exact match', () => {
      expect(validateRedirectUri(registered, 'https://app.com/callback')).toBe(true);
    });

    test('should return false for mismatch', () => {
      expect(validateRedirectUri(registered, 'https://app.com/other')).toBe(false);
    });

    test('should return false for prefix match (mismatch)', () => {
      expect(validateRedirectUri(registered, 'https://app.com/call')).toBe(false);
    });

    test('should return false if requested URI is empty', () => {
      expect(validateRedirectUri(registered, '')).toBe(false);
    });
  });

  describe('validateState', () => {
    test('should return true for valid state (>= 8 chars)', () => {
      expect(validateState('12345678')).toBe(true);
      expect(validateState('a-very-long-state-parameter')).toBe(true);
    });

    test('should return false for short state', () => {
      expect(validateState('1234567')).toBe(false);
    });

    test('should return false for empty state', () => {
      expect(validateState('')).toBe(false);
    });
  });

  describe('validateNonce', () => {
    test('should return true for valid nonce (>= 8 chars)', () => {
      expect(validateNonce('12345678')).toBe(true);
      expect(validateNonce('secure-nonce-123')).toBe(true);
    });

    test('should return false for short nonce', () => {
      expect(validateNonce('1234567')).toBe(false);
    });

    test('should return false for empty nonce', () => {
      expect(validateNonce('')).toBe(false);
    });
  });
});
