import { describe, it, expect } from 'bun:test';
import { mapUserInfoClaims, UserData } from '../../src/core/domain/userinfo_claims';

describe('mapUserInfoClaims', () => {
  const user: UserData = {
    id: 'user-123',
    nric: 'S1234567A',
    name: 'JOHN DOE',
    email: 'john@example.com',
  };

  it('should return only openid claims (sub, iss, aud, iat) when no other scopes are provided', () => {
    const claims = mapUserInfoClaims(user, 'client-1', 'https://issuer.com', ['openid']);
    
    expect(claims.sub).toBe(user.id);
    expect(claims.person_info).toEqual({});
  });

  it('should include uinfin in person_info when uinfin scope is provided', () => {
    const claims = mapUserInfoClaims(user, 'client-1', 'https://issuer.com', ['openid', 'uinfin']);
    
    expect(claims.person_info.uinfin).toEqual({ value: user.nric });
    expect(claims.person_info.name).toBeUndefined();
    expect(claims.person_info.email).toBeUndefined();
  });

  it('should include all requested scopes in person_info', () => {
    const claims = mapUserInfoClaims(user, 'client-1', 'https://issuer.com', ['openid', 'uinfin', 'name', 'email']);
    
    expect(claims.person_info.uinfin).toEqual({ value: user.nric });
    expect(claims.person_info.name).toEqual({ value: user.name });
    expect(claims.person_info.email).toEqual({ value: user.email });
  });

  it('should handle multiple spaces or different order in scopes array', () => {
    const claims = mapUserInfoClaims(user, 'client-1', 'https://issuer.com', ['name', 'openid']);
    
    expect(claims.person_info.name).toEqual({ value: user.name });
    expect(claims.person_info.uinfin).toBeUndefined();
  });
});
