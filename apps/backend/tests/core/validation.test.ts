import { describe, it, expect } from 'bun:test';
import { validateUrlSafe } from '../../src/core/auth/validation';

describe('Auth Validation: URL Safety', () => {
  it('should allow valid HTTPS URLs without IP addresses', () => {
    expect(validateUrlSafe('https://app.example.com/callback')).toBe(true);
    expect(validateUrlSafe('https://vibe-auth.com/login')).toBe(true);
  });

  it('should reject URLs with IPv4 addresses', () => {
    expect(validateUrlSafe('https://127.0.0.1/callback')).toBe(false);
    expect(validateUrlSafe('https://192.168.1.100/callback')).toBe(false);
    expect(validateUrlSafe('https://10.0.0.1/callback')).toBe(false);
    expect(validateUrlSafe('https://172.16.0.1/callback')).toBe(false);
  });

  it('should reject URLs with IPv6 addresses', () => {
    expect(validateUrlSafe('https://[2001:db8::1]/callback')).toBe(false);
    expect(validateUrlSafe('https://[::1]/callback')).toBe(false);
  });

  it('should reject non-HTTPS URLs in production-like mode', () => {
    expect(validateUrlSafe('http://app.example.com/callback', false)).toBe(false);
  });

  it('should allow http://localhost and http://127.0.0.1 ONLY if allowHttpLocalhost is true', () => {
    expect(validateUrlSafe('http://localhost/callback', true)).toBe(true);
    expect(validateUrlSafe('http://127.0.0.1/callback', true)).toBe(true);
    
    expect(validateUrlSafe('http://localhost/callback', false)).toBe(false);
    expect(validateUrlSafe('http://127.0.0.1/callback', false)).toBe(false);
  });

  it('should reject malformed URLs', () => {
    expect(validateUrlSafe('not-a-url')).toBe(false);
    expect(validateUrlSafe('https://')).toBe(false);
  });
});
