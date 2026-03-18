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
    // createEmptyMyinfoPerson already sets them to { value: null, source: '1', ... }
    
    const result = mapMyinfoProfile(person);
    
    expect(result.aliasname).toEqual({ 
      value: null,
      source: '1',
      classification: 'C',
      lastupdated: '2024-03-18'
    });
  });

  it('should handle complex nested structures like regadd correctly', () => {
    const person = createEmptyMyinfoPerson('user-1');
    person.regadd = {
      type: 'SG',
      block: { value: '123', source: '1', classification: 'C', lastupdated: '2024-03-18' },
      building: { value: 'TECH TOWER', source: '1', classification: 'C', lastupdated: '2024-03-18' },
      floor: { value: '10', source: '1', classification: 'C', lastupdated: '2024-03-18' },
      unit: { value: '101', source: '1', classification: 'C', lastupdated: '2024-03-18' },
      street: { value: 'STREET 1', source: '1', classification: 'C', lastupdated: '2024-03-18' },
      postal: { value: '123456', source: '1', classification: 'C', lastupdated: '2024-03-18' },
      country: { code: 'SG', desc: 'SINGAPORE' }
    };
    
    const result = mapMyinfoProfile(person);
    
    expect(result.regadd.type).toBe('SG');
    expect(result.regadd.country).toEqual({ code: 'SG', desc: 'SINGAPORE' });
    expect(result.regadd.block.value).toBe('123');
  });

  it('should handle vehicles array correctly', () => {
    const person = createEmptyMyinfoPerson('user-1');
    person.vehicles = [
      {
        vehicleno: { value: 'SBA1234A', source: '1', classification: 'C', lastupdated: '2024-03-18' },
        type: { value: 'PRIVATE MOTOR CAR', source: '1', classification: 'C', lastupdated: '2024-03-18' },
        make: { value: 'TOYOTA', source: '1', classification: 'C', lastupdated: '2024-03-18' },
        model: { value: 'COROLLA', source: '1', classification: 'C', lastupdated: '2024-03-18' }
      }
    ];
    
    const result = mapMyinfoProfile(person);
    
    expect(Array.isArray(result.vehicles)).toBe(true);
    expect(result.vehicles[0].vehicleno.value).toBe('SBA1234A');
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
