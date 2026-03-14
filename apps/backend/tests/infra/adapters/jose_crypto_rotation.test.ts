import { describe, it, expect, beforeAll } from 'bun:test';
import { JoseCryptoService } from '../../../src/infra/adapters/jose_crypto';
import { db } from '../../../src/infra/database/client';
import { serverKeys } from '../../../src/infra/database/schema';
import { eq, and } from 'drizzle-orm';
import { sharedConfig } from '../../../../../packages/shared/src/config';

describe('JoseCryptoService: Key Rotation', () => {
  let cryptoService: JoseCryptoService;

  beforeAll(async () => {
    process.env.SERVER_KEY_ENCRYPTION_SECRET = '00'.repeat(32);
    cryptoService = new JoseCryptoService();
  });

  it('should automatically rotate keys and deactivate old ones', async () => {
    // 1. Clear any existing active keys for a clean test
    await db.update(serverKeys).set({ isActive: false }).where(eq(serverKeys.isActive, true));

    // 2. Generate an "old" key manually
    const oldKeyId = crypto.randomUUID();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    // We need a valid encrypted key for it to be "decryptable" during rotation checks
    const { encryptedKey, iv, authTag } = (cryptoService as any).constructor.name === 'JoseCryptoService' 
      ? await cryptoService.generateKeyPair().then(async () => {
          const [k] = await db.select().from(serverKeys).orderBy((serverKeys.createdAt)).limit(1);
          return k;
        })
      : { encryptedKey: 'foo', iv: 'bar', authTag: 'baz' };

    await db.insert(serverKeys).values({
      id: oldKeyId,
      encryptedKey,
      iv,
      authTag,
      isActive: true,
      createdAt: thirtyDaysAgo,
    });

    // 3. Run rotation
    await cryptoService.rotateKeys();

    // 4. Verify:
    // - New key should have been generated (since newest was 30 days old)
    // - Old key should be deactivated (since it was > GRACE_PERIOD_DAYS)
    
    const [oldKey] = await db.select().from(serverKeys).where(eq(serverKeys.id, oldKeyId));
    expect(oldKey.isActive).toBe(false);

    const activeKeys = await db.select().from(serverKeys).where(eq(serverKeys.isActive, true));
    expect(activeKeys.length).toBeGreaterThan(0);
    expect(activeKeys.find(k => k.id === oldKeyId)).toBeUndefined();
  });
});
