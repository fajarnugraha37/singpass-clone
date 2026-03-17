import { expect, describe, it } from 'bun:test';
import { mapMyinfoProfile } from '../../../../src/application/mappers/myinfo-mapper';
import { createEmptyMyinfoPerson } from '../../../../src/core/domain/myinfo-person';

describe('MyinfoMapper', () => {
  it('should wrap primitive fields in {"value": ...}', () => {
    const person = createEmptyMyinfoPerson('user-1');
    person.name.value = 'JOHN DOE';
    
    const result = mapMyinfoProfile(person);
    
    expect(result.name.value).toBe('JOHN DOE');
  });

  it('should include metadata fields (source, classification, lastupdated)', () => {
    const person = createEmptyMyinfoPerson('user-1');
    person.name = { 
      value: 'JOHN DOE',
      source: '1',
      classification: 'C',
      lastupdated: '2024-03-18'
    };
    
    const result = mapMyinfoProfile(person);
    
    expect(result.name.source).toBe('1');
    expect(result.name.classification).toBe('C');
    expect(result.name.lastupdated).toBe('2024-03-18');
  });

  it('should return explicit null for missing fields with metadata', () => {
    const person = createEmptyMyinfoPerson('user-1');
    // createEmptyMyinfoPerson already sets them to { value: null }
    
    const result = mapMyinfoProfile(person);
    
    expect(result.aliasname).toEqual({ 
      value: null,
      source: '1',
      classification: 'C',
      lastupdated: '2024-03-18'
    });
  });

  it('should handle complex nested structures like mobileno', () => {
    const person = createEmptyMyinfoPerson('user-1');
    person.mobileno = {
      prefix: { value: '+' },
      areacode: { value: '65' },
      nbr: { value: '91234567' }
    };
    
    const result = mapMyinfoProfile(person);
    
    expect(result.mobileno).toEqual({
      prefix: { value: '+' },
      areacode: { value: '65' },
      nbr: { value: '91234567' }
    });
  });

  it('should return the full person_info structure', () => {
    const person = createEmptyMyinfoPerson('user-1');
    const result = mapMyinfoProfile(person);
    
    // As per Myinfo v5 specs, it should return all keys with nulls if not present
    expect(result).toHaveProperty('uinfin');
    expect(result).toHaveProperty('name');
    expect(result).toHaveProperty('email');
    expect(result).toHaveProperty('mobileno');
    expect(result).toHaveProperty('regadd');
  });
});
