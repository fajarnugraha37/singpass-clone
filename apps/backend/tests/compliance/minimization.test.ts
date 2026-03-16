import { describe, expect, it } from 'bun:test';
import { filterPersonByScopes } from '../../src/core/myinfo/scope_mapper';

describe('Singpass OIDC Compliance: Data Minimization', () => {
  const mockPerson = {
    userId: 'user-123',
    sub: 'user-123',
    uinfin: { value: 'S1234567A' },
    name: { value: 'John Doe' },
    sex: { value: 'M' },
    dob: { value: '1990-01-01' },
    email: { value: 'john@example.com' },
    mobileno: { value: '91234567' },
    finance: {
      cpfbalances: { oa: { value: 100 }, ma: { value: 50 } },
      noa_basic: { value: 5000 }
    }
  };

  it('SHOULD only return attributes allowed by the "openid name" scope', () => {
    const scopes = ['openid', 'name'];
    const filtered = filterPersonByScopes(mockPerson, scopes);
    
    expect(filtered.sub).toBe('user-123');
    expect(filtered.name).toBeDefined();
    expect(filtered.uinfin).toBeUndefined();
    expect(filtered.email).toBeUndefined();
  });

  it('SHOULD only return attributes allowed by the "openid uinfin dob" scope', () => {
    const scopes = ['openid', 'uinfin', 'dob'];
    const filtered = filterPersonByScopes(mockPerson, scopes);
    
    expect(filtered.uinfin).toBeDefined();
    expect(filtered.dob).toBeDefined();
    expect(filtered.name).toBeUndefined();
  });

  it('SHOULD handle nested financial attributes correctly', () => {
    const scopes = ['cpfbalances'];
    const filtered = filterPersonByScopes(mockPerson, scopes);
    
    expect(filtered.finance).toBeDefined();
    expect(filtered.finance.cpfbalances).toBeDefined();
    expect(filtered.finance.noa_basic).toBeUndefined();
  });
});
