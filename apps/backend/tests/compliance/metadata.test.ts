import { expect, test, describe, beforeEach, afterEach } from 'bun:test'
import { DrizzleUserInfoRepository } from '../../src/infra/adapters/db/drizzle_userinfo_repository'
import { DrizzleClientRegistry } from '../../src/infra/adapters/client_registry'
import { CreateTestUserUseCase } from '../../src/core/use-cases/create-test-user'
import { db } from '../../src/infra/database/client'
import { users, clients } from '../../src/infra/database/schema'
import { eq } from 'drizzle-orm'

describe('Singpass Compliance: Metadata and Entity Association', () => {
  const userRepository = new DrizzleUserInfoRepository();
  const clientRegistry = new DrizzleClientRegistry();
  const createTestUserUseCase = new CreateTestUserUseCase(userRepository);

  const TEST_UEN = 'UEN1234567';
  const createdUserIds: string[] = [];

  afterEach(async () => {
    // Cleanup users
    for (const userId of createdUserIds) {
      await userRepository.deleteUser(userId);
    }
    createdUserIds.length = 0;

    // Cleanup clients if any
    await db.delete(clients).where(eq(clients.uen, TEST_UEN));
  });

  describe('US4: Entity Association', () => {
    test('should successfully store and retrieve client with UEN and metadata', async () => {
      const clientId = 'compliance-test-client';
      const clientData = {
        id: clientId,
        name: 'Compliance Test App',
        appType: 'Login',
        uen: TEST_UEN,
        isActive: true,
        allowedScopes: ['openid', 'uinfin'],
        redirectUris: ['https://example.com/cb'],
        siteUrl: 'https://example.com',
        description: 'Test application for compliance',
        supportEmails: ['support@example.com'],
        agreementAccepted: true,
      };

      // Insert directly into DB for testing
      await db.insert(clients).values(clientData);

      // Retrieve via registry
      const client = await clientRegistry.getClientConfig(clientId);
      
      expect(client).not.toBeNull();
      expect(client?.uen).toBe(TEST_UEN);
      expect(client?.siteUrl).toBe('https://example.com');
      expect(client?.appDescription).toBe('Test application for compliance');
      expect(client?.supportEmails).toContain('support@example.com');
      expect(client?.hasAcceptedAgreement).toBe(true);
    });
  });

  describe('FR-008: Test Account Limit', () => {
    test('should provide a warning when the soft limit of 5 accounts is reached', async () => {
      // 1. Create 5 users for the same UEN
      for (let i = 0; i < 5; i++) {
        const result = await createTestUserUseCase.execute({
          nric: `S123456${i}A`,
          name: `Test User ${i}`,
          email: `test${i}@example.com`,
          uen: TEST_UEN,
        });
        createdUserIds.push(result.user.id);
        expect(result.warning).toBeUndefined();
      }

      // 2. Create the 6th user - should have a warning
      const result6 = await createTestUserUseCase.execute({
        nric: `S1234566A`,
        name: `Test User 6`,
        email: `test6@example.com`,
        uen: TEST_UEN,
      });
      createdUserIds.push(result6.user.id);

      expect(result6.warning).toBeDefined();
      expect(result6.warning).toContain('reached the soft limit of 5 test accounts');
    });

    test('should count users by UEN accurately', async () => {
      const count0 = await userRepository.countUsersByUen(TEST_UEN);
      expect(count0).toBe(0);

      const user = await userRepository.createUser({
        nric: 'S7654321Z',
        name: 'UEN Counter Test',
        email: 'counter@example.com',
        uen: TEST_UEN,
      });
      createdUserIds.push(user.id);

      const count1 = await userRepository.countUsersByUen(TEST_UEN);
      expect(count1).toBe(1);
    });
  });
});
