import { describe, expect, it, beforeEach } from 'bun:test';
import { DrizzleAuthorizationCodeRepository } from '../../src/infra/adapters/db/drizzle_authorization_code_repository';
import type { AuthorizationCode } from '../../src/core/domain/authorizationCode';

describe('Singpass OIDC Compliance: Code Replay Protection', () => {
  let repository: DrizzleAuthorizationCodeRepository;

  beforeEach(() => {
    repository = new DrizzleAuthorizationCodeRepository();
  });

  it('SHOULD allow using a valid code once', async () => {
    const codeValue = `test-code-${crypto.randomUUID()}`;
    const code: AuthorizationCode = {
      code: codeValue,
      userId: 'user-1',
      clientId: 'client-1',
      codeChallenge: 'challenge',
      dpopJkt: 'jkt',
      scope: 'openid',
      redirectUri: 'http://localhost:3000/cb',
      expiresAt: new Date(Date.now() + 300000),
      used: false,
      createdAt: new Date(),
      amr: ['pwd'],
      loa: 1
    };

    await repository.save(code);
    
    // 1. First retrieval should work
    const retrieved = await repository.getByCode(codeValue);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.code).toBe(codeValue);
    
    // 2. Mark as used
    await repository.markAsUsed(codeValue);
    
    // 3. Second retrieval should fail (replay protection)
    const retrievedAgain = await repository.getByCode(codeValue);
    expect(retrievedAgain).toBeNull();
  });

  it('SHOULD reject an expired code', async () => {
    const codeValue = `expired-code-${crypto.randomUUID()}`;
    const code: AuthorizationCode = {
      code: codeValue,
      userId: 'user-1',
      clientId: 'client-1',
      codeChallenge: 'challenge',
      dpopJkt: 'jkt',
      scope: 'openid',
      redirectUri: 'http://localhost:3000/cb',
      expiresAt: new Date(Date.now() - 1000), // Expired 1s ago
      used: false,
      createdAt: new Date(Date.now() - 60000),
      amr: ['pwd'],
      loa: 1
    };

    await repository.save(code);
    
    const retrieved = await repository.getByCode(codeValue);
    expect(retrieved).toBeNull();
  });

  it('SHOULD return null for non-existent code', async () => {
    const retrieved = await repository.getByCode('non-existent-code');
    expect(retrieved).toBeNull();
  });

  it('SHOULD ensure atomic single-use even with concurrent requests', async () => {
    const codeValue = `concurrent-code-${crypto.randomUUID()}`;
    const code: AuthorizationCode = {
      code: codeValue,
      userId: 'user-1',
      clientId: 'client-1',
      codeChallenge: 'challenge',
      dpopJkt: 'jkt',
      scope: 'openid',
      redirectUri: 'http://localhost:3000/cb',
      expiresAt: new Date(Date.now() + 300000),
      used: false,
      createdAt: new Date(),
      amr: ['pwd'],
      loa: 1
    };

    await repository.save(code);

    // Simulate two concurrent "exchange" attempts
    // In a real scenario, this would be two separate HTTP requests
    const p1 = repository.markAsUsed(codeValue);
    const p2 = repository.markAsUsed(codeValue);

    await Promise.all([p1, p2]);

    // After both finish, the code MUST be unavailable for further use
    const retrieved = await repository.getByCode(codeValue);
    expect(retrieved).toBeNull();
  });
});
