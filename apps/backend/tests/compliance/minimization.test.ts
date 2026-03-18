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
      'cpfbalances.oa': { value: 100, source: '1', classification: 'C', lastupdated: '2024-03-18' },
      'cpfbalances.ma': { value: 50, source: '1', classification: 'C', lastupdated: '2024-03-18' },
      'noa-basic': { amount: { value: 5000, source: '1', classification: 'C', lastupdated: '2024-03-18' }, yearofassessment: { value: '2023', source: '1', classification: 'C', lastupdated: '2024-03-18' } }
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
    expect(filtered.finance['cpfbalances.oa']).toBeDefined();
    expect(filtered.finance['noa-basic']).toBeUndefined();
  });
});
