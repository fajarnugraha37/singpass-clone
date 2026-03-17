import * as jose from 'jose';
import type { JWK, CryptoKey } from 'jose';
import { db } from '../../database/client';
import { serverKeys } from '../../database/schema';
import { encryptKey, decryptKey } from '../encryption';
import { eq, and, desc, lt } from 'drizzle-orm';
import { sharedConfig } from '../../../../../../packages/shared/src/config';
import type { ServerKeyManager } from '../../../core/domain/key_manager';
import type { SecurityAuditService } from '../../../core/domain/audit_service';

export class DrizzleServerKeyManager implements ServerKeyManager {
  private algorithm = 'ES256';

  constructor(private auditService?: SecurityAuditService) {}

  async generateKeyPair(use: 'sig' | 'enc' = 'sig'): Promise<{ id: string; publicKey: JWK }> {
    const { publicKey, privateKey } = await jose.generateKeyPair(this.algorithm, { extractable: true });
    
    const privateKeyExported = await jose.exportPKCS8(privateKey);
    const publicKeyJWK = await jose.exportJWK(publicKey);
    const kid = crypto.randomUUID();
    
    publicKeyJWK.kid = kid;
    publicKeyJWK.use = use;
    publicKeyJWK.alg = this.algorithm;

    const encrypted = encryptKey(Buffer.from(privateKeyExported));

    await db.insert(serverKeys).values({
      id: kid,
      encryptedKey: encrypted.encryptedKey,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
      use: use,
      isActive: true,
    });

    return { id: kid, publicKey: publicKeyJWK };
  }

  async getPublicJWKS(): Promise<{ keys: JWK[] }> {
    const activeKeys = await db.select().from(serverKeys).where(eq(serverKeys.isActive, true));
    const keys: JWK[] = [];
    
    for (const k of activeKeys) {
      try {
        const decrypted = decryptKey({
          encryptedKey: k.encryptedKey,
          iv: k.iv,
          authTag: k.authTag,
        });
        const privateKey = await jose.importPKCS8(decrypted.toString(), this.algorithm, { extractable: true });
        const fullJWK = await jose.exportJWK(privateKey);

        const { d, p, q, dp, dq, qi, ...publicKey } = fullJWK as any;

        keys.push({
          ...publicKey,
          kid: k.id,
          use: k.use as 'sig' | 'enc',
          alg: this.algorithm,
        } as JWK);
      } catch (error: any) {
        console.warn(`[KeyManager] Failed to decrypt key ${k.id}, skipping.`);
      }
    }

    return { keys };
  }

  async getActiveKey(keyId?: string): Promise<{ id: string; privateKey: CryptoKey; publicKey: JWK }> {
    const query = keyId
      ? db.select().from(serverKeys).where(eq(serverKeys.id, keyId))
      : db.select().from(serverKeys).where(and(eq(serverKeys.isActive, true), eq(serverKeys.use, 'sig'))).orderBy(desc(serverKeys.createdAt));

    const records = await query;
    if (records.length === 0) {
      throw new Error(keyId ? `Key ${keyId} not found` : 'No active signing key found');
    }

    for (const keyRecord of records) {
      try {
        const decryptedPrivateKey = decryptKey({
          encryptedKey: keyRecord.encryptedKey,
          iv: keyRecord.iv,
          authTag: keyRecord.authTag,
        });

        const privateKey = await jose.importPKCS8(decryptedPrivateKey.toString(), this.algorithm, { extractable: true });
        const publicKeyJWK = await jose.exportJWK(privateKey);
        
        return {
          id: keyRecord.id,
          privateKey,
          publicKey: {
            ...publicKeyJWK,
            kid: keyRecord.id,
            use: keyRecord.use as 'sig' | 'enc',
            alg: this.algorithm,
          } as JWK,
        };
      } catch (e: any) {
        if (keyId) throw new Error(`Failed to decrypt requested key ${keyId}`);
        console.warn(`[KeyManager] Skipping undecryptable key ${keyRecord.id}`);
      }
    }

    throw new Error('No decryptable active signing key found');
  }

  async ensureActiveKey(): Promise<void> {
    const activeSigningKeys = await db.select().from(serverKeys).where(and(eq(serverKeys.isActive, true), eq(serverKeys.use, 'sig')));
    
    let hasSigning = false;
    for (const k of activeSigningKeys) {
      try {
        decryptKey({ encryptedKey: k.encryptedKey, iv: k.iv, authTag: k.authTag });
        hasSigning = true;
        break;
      } catch (e) {}
    }

    if (!hasSigning) {
      console.info('[KeyManager] No decryptable signing keys found. Provisioning...');
      await this.generateKeyPair('sig');
    }

    const activeEncryptionKeys = await db.select().from(serverKeys).where(and(eq(serverKeys.isActive, true), eq(serverKeys.use, 'enc')));
    let hasEncryption = false;
    for (const k of activeEncryptionKeys) {
      try {
        decryptKey({ encryptedKey: k.encryptedKey, iv: k.iv, authTag: k.authTag });
        hasEncryption = true;
        break;
      } catch (e) {}
    }

    if (!hasEncryption) {
      console.info('[KeyManager] No decryptable encryption keys found. Provisioning...');
      await this.generateKeyPair('enc');
    }
  }

  async rotateKeys(): Promise<void> {
    const [newestKey] = await db.select()
      .from(serverKeys)
      .where(eq(serverKeys.isActive, true))
      .orderBy(desc(serverKeys.createdAt))
      .limit(1);

    const rotationMillis = sharedConfig.SECURITY.SERVER_KEY_ROTATION_DAYS * 24 * 60 * 60 * 1000;
    
    if (!newestKey || (Date.now() - (newestKey.createdAt?.getTime() || 0)) > rotationMillis) {
      await this.generateKeyPair();
      await this.auditService?.logEvent({ type: 'KEY_ROTATION_GENERATE', severity: 'INFO' });
    }

    const graceMillis = sharedConfig.SECURITY.SERVER_KEY_GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000;
    const expirationDate = new Date(Date.now() - graceMillis);

    await db.update(serverKeys)
      .set({ isActive: false })
      .where(and(eq(serverKeys.isActive, true), lt(serverKeys.createdAt, expirationDate)));
  }

  async purgeOldKeys(daysToKeep: number): Promise<number> {
    const cutoff = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    const deleted = await db.delete(serverKeys)
      .where(and(eq(serverKeys.isActive, false), lt(serverKeys.createdAt, cutoff)))
      .returning();
    return deleted.length;
  }
}
