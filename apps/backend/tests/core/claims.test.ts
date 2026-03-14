import { describe, it, expect } from 'bun:test';
import { mapLoaToAcr, buildSubAttributes, UserAttributes } from '../../src/core/domain/claims';

describe('Claims Mapping', () => {
  describe('mapLoaToAcr', () => {
    it('should map LOA 1 to the correct ACR URI', () => {
      expect(mapLoaToAcr(1)).toBe('urn:singpass:authentication:loa:1');
    });

    it('should map LOA 2 to the correct ACR URI', () => {
      expect(mapLoaToAcr(2)).toBe('urn:singpass:authentication:loa:2');
    });

    it('should map LOA 3 to the correct ACR URI', () => {
      expect(mapLoaToAcr(3)).toBe('urn:singpass:authentication:loa:3');
    });

    it('should fallback to LOA 1 for unknown levels', () => {
      expect(mapLoaToAcr(0)).toBe('urn:singpass:authentication:loa:1');
      expect(mapLoaToAcr(99)).toBe('urn:singpass:authentication:loa:1');
    });
  });

  describe('buildSubAttributes', () => {
    const mockUser: UserAttributes = {
      nric: 'S1234567A',
      name: 'Tan Ah Kow',
      email: 'tan@example.com',
      mobileno: '81234567'
    };

    it('should include identity attributes when user.identity scope is present', () => {
      const result = buildSubAttributes(mockUser, ['openid', 'user.identity']);
      expect(result).toBeDefined();
      expect(result?.identity_number).toBe(mockUser.nric);
      expect(result?.identity_coi).toBe('SG');
      expect(result?.account_type).toBe('standard');
    });

    it('should include name when name scope is present', () => {
      const result = buildSubAttributes(mockUser, ['openid', 'name']);
      expect(result).toBeDefined();
      expect(result?.name).toBe(mockUser.name);
    });

    it('should include email when email scope is present', () => {
      const result = buildSubAttributes(mockUser, ['openid', 'email']);
      expect(result).toBeDefined();
      expect(result?.email).toBe(mockUser.email);
    });

    it('should include mobileno when mobileno scope is present', () => {
      const result = buildSubAttributes(mockUser, ['openid', 'mobileno']);
      expect(result).toBeDefined();
      expect(result?.mobileno).toBe(mockUser.mobileno);
    });

    it('should return undefined when no profile scopes are present', () => {
      const result = buildSubAttributes(mockUser, ['openid']);
      expect(result).toBeUndefined();
    });

    it('should merge multiple scopes', () => {
      const result = buildSubAttributes(mockUser, ['openid', 'user.identity', 'name']);
      expect(result).toBeDefined();
      expect(result?.identity_number).toBe(mockUser.nric);
      expect(result?.name).toBe(mockUser.name);
    });

    it('should omit fields if user data is missing', () => {
      const incompleteUser: UserAttributes = { nric: 'S1234567A', name: 'Tan' };
      const result = buildSubAttributes(incompleteUser, ['openid', 'email', 'name']);
      expect(result).toBeDefined();
      expect(result?.name).toBe('Tan');
      expect(result?.email).toBeUndefined();
    });
  });
});
