import { describe, it, expect } from 'bun:test';
import { mapUserInfoClaims, UserData } from '../../src/core/domain/userinfo_claims';

describe('mapUserInfoClaims', () => {
  const user: UserData = {
    id: 'user-123',
    nric: 'S1234567A',
    name: 'JOHN DOE',
    email: 'john@example.com',
  };

  it('should return only openid claims (sub, iss, aud, iat, acr, amr, sub_type) when no other scopes are provided', () => {
    const claims = mapUserInfoClaims(user, 'client-1', 'https://issuer.com', ['openid'], 2, ['pwd', 'otp-sms']);
    
    expect(claims.sub).toBe(user.id);
    expect(claims.person_info).toEqual({});
    expect((claims as any).sub_attributes).toBeUndefined();
  });

  it('should include uinfin and mobileno in person_info when corresponding scopes are provided', () => {
    const userWithMobile: UserData = { ...user, mobileno: '91234567' };
    const claims = mapUserInfoClaims(userWithMobile, 'client-1', 'https://issuer.com', ['openid', 'uinfin', 'mobileno'], 2, ['pwd', 'otp-sms']);

    expect(claims.person_info?.uinfin).toEqual({ value: user.nric });
    expect(claims.person_info?.mobileno).toEqual({ value: '91234567' });
    expect(claims.person_info?.name).toBeUndefined();
  });

  it('should include all requested scopes in person_info', () => {
    const claims = mapUserInfoClaims(user, 'client-1', 'https://issuer.com', ['openid', 'uinfin', 'name', 'email'], 2, ['pwd', 'otp-sms']);

    expect(claims.person_info?.uinfin).toEqual({ value: user.nric });
    expect(claims.person_info?.name).toEqual({ value: user.name });
    expect(claims.person_info?.email).toEqual({ value: user.email });
  });

  it('should handle multiple spaces or different order in scopes array', () => {
    const claims = mapUserInfoClaims(user, 'client-1', 'https://issuer.com', ['name', 'openid'], 2, ['pwd', 'otp-sms']);

    expect(claims.person_info?.name).toEqual({ value: user.name });
    expect(claims.person_info?.uinfin).toBeUndefined();
  });

  it('should omit fields from person_info when user data is missing even if scope is granted', () => {
    const incompleteUser: UserData = { ...user, email: '' };
    const claims = mapUserInfoClaims(incompleteUser, 'client-1', 'https://issuer.com', ['openid', 'email', 'name'], 2, ['pwd', 'otp-sms']);

    expect(claims.person_info?.name).toEqual({ value: user.name });
    expect(claims.person_info?.email).toBeUndefined();
  });

  it('should ensure person_info is present but empty when no identity scopes are granted', () => {
    const claims = mapUserInfoClaims(user, 'client-1', 'https://issuer.com', ['openid'], 2, ['pwd', 'otp-sms']);
    
    expect(claims.person_info).toBeDefined();
    expect(claims.person_info).toEqual({});
  });
});
