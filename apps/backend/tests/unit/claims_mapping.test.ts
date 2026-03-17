import { expect, test, describe } from 'bun:test';
import { buildSubAttributes, UserAttributes } from '../../src/core/domain/claims';

describe('ID Token Claims Mapping', () => {
  const baseUser: any = {
    nric: 'S1234567A',
    name: 'JOHN DOE',
    email: 'john@example.com',
  };

  test('should map account_type to "standard" by default or if specified', () => {
    const user: UserAttributes = {
      ...baseUser,
      account_type: 'standard',
    } as any;

    const attributes = buildSubAttributes(user, ['openid', 'user.identity']);
    expect(attributes?.account_type).toBe('standard');
  });

  test('should map account_type to "foreign" if specified', () => {
    const user: UserAttributes = {
      ...baseUser,
      account_type: 'foreign',
    } as any;

    const attributes = buildSubAttributes(user, ['openid', 'user.identity']);
    expect(attributes?.account_type).toBe('foreign');
  });

  test('should default to "standard" if account_type is missing', () => {
    const user: UserAttributes = {
      ...baseUser,
    } as any;

    const attributes = buildSubAttributes(user, ['openid', 'user.identity']);
    expect(attributes?.account_type).toBe('standard');
  });
});
