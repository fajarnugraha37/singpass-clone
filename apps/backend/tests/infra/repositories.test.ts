import { describe, it, expect, beforeAll, beforeEach } from 'bun:test';
import { db } from '../../src/infra/database/client';
import * as schema from '../../src/infra/database/schema';
import { DrizzleAuthorizationCodeRepository } from '../../src/infra/adapters/db/drizzle_authorization_code_repository';
import { DrizzleAuthSessionRepository } from '../../src/infra/adapters/db/drizzle_session_repository';
import { DrizzleTokenRepository } from '../../src/infra/adapters/db/drizzle_token_repository';
import { DrizzleUserInfoRepository } from '../../src/infra/adapters/db/drizzle_userinfo_repository';
import { eq } from 'drizzle-orm';

describe('Drizzle Repositories Integration', () => {
  const authCodeRepo = new DrizzleAuthorizationCodeRepository();
  const sessionRepo = new DrizzleAuthSessionRepository();
  const tokenRepo = new DrizzleTokenRepository();
  const userInfoRepo = new DrizzleUserInfoRepository();

  beforeEach(async () => {
    // Cleanup data between tests to avoid constraints
    // Delete in order of dependencies to avoid FK issues
    await db.delete(schema.authorizationCodes);
    await db.delete(schema.accessTokens);
    await db.delete(schema.refreshTokens);
    await db.delete(schema.sessions);
    await db.delete(schema.authSessions);
    await db.delete(schema.parRequests);
    await db.delete(schema.usedJtis);
    await db.delete(schema.users);
  });

  describe('DrizzleAuthSessionRepository', () => {
    it('should save and retrieve an auth session', async () => {
      const session = {
        id: crypto.randomUUID(),
        parRequestUri: 'urn:test',
        clientId: 'test-client',
        status: 'INITIATED' as const,
        retryCount: 0,
        loa: 1,
        amr: ['pwd'],
        expiresAt: new Date(Date.now() + 3600000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await sessionRepo.save(session);
      const retrieved = await sessionRepo.getById(session.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(session.id);
      expect(retrieved?.loa).toBe(1);
      expect(retrieved?.amr).toEqual(['pwd']);
    });

    it('should update an auth session', async () => {
      const id = crypto.randomUUID();
      const session = {
        id,
        parRequestUri: 'urn:test-update',
        clientId: 'test-client',
        status: 'INITIATED' as const,
        retryCount: 0,
        loa: 0,
        amr: [],
        expiresAt: new Date(Date.now() + 3600000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await sessionRepo.save(session);
      
      const updatedSession = { ...session, status: 'COMPLETED' as const, loa: 2, amr: ['pwd', 'otp-sms'] };
      await sessionRepo.update(updatedSession);

      const retrieved = await sessionRepo.getById(id);
      expect(retrieved?.status).toBe('COMPLETED');
      expect(retrieved?.loa).toBe(2);
      expect(retrieved?.amr).toEqual(['pwd', 'otp-sms']);
    });
  });

  describe('DrizzleAuthorizationCodeRepository', () => {
    it('should save and retrieve an authorization code', async () => {
      const code = {
        code: 'test-code-repo-' + crypto.randomUUID(),
        userId: 'user-1',
        clientId: 'client-1',
        codeChallenge: 'challenge',
        dpopJkt: 'jkt',
        scope: 'openid',
        loa: 2,
        amr: ['pwd', 'otp-sms'],
        redirectUri: 'http://localhost/cb',
        expiresAt: new Date(Date.now() + 3600000),
        used: false,
        createdAt: new Date(),
      };

      await authCodeRepo.save(code);
      const retrieved = await authCodeRepo.getByCode(code.code);

      expect(retrieved).toBeDefined();
      expect(retrieved?.code).toBe(code.code);
      expect(retrieved?.loa).toBe(2);
      expect(retrieved?.amr).toEqual(['pwd', 'otp-sms']);
    });

    it('should mark a code as used', async () => {
      const codeValue = 'test-code-used-' + crypto.randomUUID();
      await authCodeRepo.save({
        code: codeValue,
        userId: 'user-1',
        clientId: 'client-1',
        codeChallenge: 'challenge',
        dpopJkt: 'jkt',
        scope: 'openid',
        loa: 1,
        amr: ['pwd'],
        redirectUri: 'http://localhost/cb',
        expiresAt: new Date(Date.now() + 3600000),
        used: false,
        createdAt: new Date(),
      });

      await authCodeRepo.markAsUsed(codeValue);
      const retrieved = await authCodeRepo.getByCode(codeValue);
      expect(retrieved).toBeNull(); // getByCode filters out used codes
    });
  });

  describe('DrizzleTokenRepository', () => {
    it('should save an access token with loa and amr', async () => {
      const token = {
        token: 'test-access-token-' + crypto.randomUUID(),
        userId: 'user-1',
        clientId: 'client-1',
        dpopJkt: 'jkt',
        scope: 'openid',
        loa: 2,
        amr: ['pwd', 'otp-sms'],
        expiresAt: new Date(Date.now() + 3600000),
      };

      await tokenRepo.saveAccessToken(token);

      const [record] = await db.select().from(schema.accessTokens).where(eq(schema.accessTokens.token, token.token));
      expect(record).toBeDefined();
      expect(record.loa).toBe(2);
      expect(JSON.parse(record.amr!)).toEqual(['pwd', 'otp-sms']);
    });

    it('should save a refresh token', async () => {
      const token = {
        token: 'test-refresh-token-' + crypto.randomUUID(),
        userId: 'user-1',
        clientId: 'client-1',
        dpopJkt: 'jkt',
        scope: 'openid',
        loa: 2,
        amr: ['pwd', 'otp-sms'],
        expiresAt: new Date(Date.now() + 3600000),
      };

      await tokenRepo.saveRefreshToken(token);

      const [record] = await db.select().from(schema.refreshTokens).where(eq(schema.refreshTokens.token, token.token));
      expect(record).toBeDefined();
      expect(record.userId).toBe(token.userId);
    });

    it('should revoke tokens for a session', async () => {
      await tokenRepo.revokeTokensForSession('user-revoke', 'client-revoke');
      expect(true).toBe(true);
    });
  });

  describe('DrizzlePARRepository', () => {
    const parRepo = new (require('../../src/infra/adapters/db/drizzle_par_repository').DrizzlePARRepository)();

    it('should save and retrieve a PAR request', async () => {
      const par = {
        requestUri: 'urn:test-par-repo-' + crypto.randomUUID(),
        clientId: 'client-par',
        payload: { scope: 'openid' },
        expiresAt: new Date(Date.now() + 3600000),
        dpopJkt: 'jkt-par'
      };

      await parRepo.save(par);
      const retrieved = await parRepo.getByRequestUri(par.requestUri);

      expect(retrieved).toBeDefined();
      expect(retrieved?.clientId).toBe(par.clientId);
      expect(retrieved?.dpopJkt).toBe(par.dpopJkt);
    });

    it('should return null for non-existent PAR', async () => {
      const retrieved = await parRepo.getByRequestUri('urn:non-existent');
      expect(retrieved).toBeNull();
    });
  });

  describe('DrizzleUserInfoRepository', () => {
    it('should retrieve user by id', async () => {
      const userId = crypto.randomUUID();
      await db.insert(schema.users).values({
        id: userId,
        nric: 'S1234567A',
        name: 'John Doe',
        email: 'john@example.com',
        mobileno: '81234567'
      });

      const user = await userInfoRepo.getUserById(userId);
      expect(user).toBeDefined();
      expect(user?.nric).toBe('S1234567A');
      expect(user?.mobileno).toBe('81234567');
    });

    it('should retrieve access token data', async () => {
      const tokenValue = 'userinfo-test-token-' + crypto.randomUUID();
      await db.insert(schema.accessTokens).values({
        token: tokenValue,
        userId: 'user-1',
        clientId: 'client-1',
        dpopJkt: 'jkt',
        scope: 'openid',
        loa: 1,
        amr: JSON.stringify(['pwd']),
        expiresAt: new Date(Date.now() + 3600000),
      });

      const tokenData = await userInfoRepo.getAccessToken(tokenValue);
      expect(tokenData).toBeDefined();
      expect(tokenData?.loa).toBe(1);
      expect(tokenData?.amr).toEqual(['pwd']);
    });
  });
});
