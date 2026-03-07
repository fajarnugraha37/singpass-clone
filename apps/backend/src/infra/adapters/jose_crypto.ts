import * as jose from 'jose';
import type { JWK } from 'jose';
import type { CryptoService } from '../../core/domain/crypto_service';
import { db } from '../database/client';
import * as schema from '../database/schema';
import { serverKeys } from '../database/schema';
import { encryptKey, decryptKey } from './encryption';
import { eq, and, sql } from 'drizzle-orm';
import { sharedConfig } from '../../../../../packages/shared/src/config';

import type { SecurityAuditService } from '../../core/domain/audit_service';

export class JoseCryptoService implements CryptoService {
  private algorithm = 'ES256';

  constructor(private auditService?: SecurityAuditService) {}

  /**
   * Generates a new ES256 key pair and persists it to the database (encrypted).
   */
  async generateKeyPair(): Promise<{
    id: string;
    privateKey: Uint8Array;
    publicKey: JWK;
  }> {
    const { publicKey, privateKey } = await jose.generateKeyPair(this.algorithm);
    
    const privateKeyExported = await jose.exportPKCS8(privateKey);
    const publicKeyJWK = await jose.exportJWK(publicKey);
    publicKeyJWK.kid = crypto.randomUUID();
    publicKeyJWK.use = 'sig';
    publicKeyJWK.alg = this.algorithm;

    const encrypted = encryptKey(Buffer.from(privateKeyExported));

    const [inserted] = await db.insert(serverKeys).values({
      id: publicKeyJWK.kid,
      encryptedKey: encrypted.encryptedKey,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
      isActive: true,
    }).returning();

    return {
      id: inserted.id,
      privateKey: Buffer.from(privateKeyExported),
      publicKey: publicKeyJWK,
    };
  }

  /**
   * Signs a payload using an active server private key.
   */
  async sign(payload: Record<string, any>, keyId?: string): Promise<string> {
    const query = keyId 
      ? db.select().from(serverKeys).where(eq(serverKeys.id, keyId))
      : db.select().from(serverKeys).where(eq(serverKeys.isActive, true)).limit(1);

    const [keyRecord] = await query;
    if (!keyRecord) {
      throw new Error('No active signing key found');
    }

    const decryptedPrivateKey = decryptKey({
      encryptedKey: keyRecord.encryptedKey,
      iv: keyRecord.iv,
      authTag: keyRecord.authTag,
    });

    const privateKey = await jose.importPKCS8(decryptedPrivateKey.toString(), this.algorithm);

    return await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: this.algorithm, kid: keyRecord.id })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(privateKey);
  }

  /**
   * Validates a client_assertion (private_key_jwt).
   */
  async validateClientAssertion(
    assertion: string,
    clientPublicKey: JWK
  ): Promise<boolean> {
    const payload = jose.decodeJwt(assertion);
    const clientId = payload.iss || 'unknown';

    try {
      const publicKey = await jose.importJWK(clientPublicKey, this.algorithm);
      await jose.jwtVerify(assertion, publicKey, {
        algorithms: [this.algorithm],
      });

      await this.auditService?.logEvent({
        type: 'CLIENT_AUTH_SUCCESS',
        severity: 'INFO',
        clientId,
      });

      return true;
    } catch (error: any) {
      await this.auditService?.logEvent({
        type: 'CLIENT_AUTH_FAIL',
        severity: 'WARN',
        clientId,
        details: { reason: error.message },
      });
      return false;
    }
  }

  /**
   * Validates a DPoP proof JWT.
   */
  async validateDPoPProof(
    proof: string,
    expectedMethod: string,
    expectedUrl: string
  ): Promise<{ jkt: string }> {
    const header = jose.decodeProtectedHeader(proof);
    if (!header.jwk) {
      throw new Error('DPoP proof missing jwk header');
    }

    const publicKey = await jose.importJWK(header.jwk as JWK, header.alg as string);
    const { payload } = await jose.jwtVerify(proof, publicKey, {
      typ: 'dpop+jwt',
    });

    if (payload.htm !== expectedMethod) {
      throw new Error(`DPoP htm mismatch: expected ${expectedMethod}, got ${payload.htm}`);
    }

    if (payload.htu !== expectedUrl) {
      throw new Error(`DPoP htu mismatch: expected ${expectedUrl}, got ${payload.htu}`);
    }

    // iat check (configurable window)
    const now = Math.floor(Date.now() / 1000);
    const iat = payload.iat || 0;
    const ttl = sharedConfig.SECURITY.DPOP_TTL_SECONDS;
    if (Math.abs(now - iat) > ttl) {
      throw new Error(`DPoP proof expired (iat > ${ttl}s)`);
    }

    // jti uniqueness check (prevents replay)
    if (!payload.jti) {
      throw new Error('DPoP proof missing jti');
    }

    // For simplicity in this clone, we check the audit log for previous usage of this JTI
    // In a production system, a dedicated TTL-based cache (Redis) would be used.
    const [existingJti] = await db.select()
      .from(schema.securityAuditLog)
      .where(
        and(
          eq(schema.securityAuditLog.eventType, 'DPOP_VALIDATION_SUCCESS'),
          sql`${schema.securityAuditLog.details}->>'$.jti' = ${payload.jti}`
        )
      )
      .limit(1);

    if (existingJti) {
      await this.auditService?.logEvent({
        type: 'DPOP_VALIDATION_FAIL',
        severity: 'ERROR',
        details: { jti: payload.jti, reason: 'Replay attack detected' },
      });
      throw new Error('DPoP proof jti already used (replay attack)');
    }

    const jkt = await jose.calculateJwkThumbprint(header.jwk as JWK);

    await this.auditService?.logEvent({
      type: 'DPOP_VALIDATION_SUCCESS',
      severity: 'INFO',
      details: { jti: payload.jti, jkt },
    });

    return { jkt };
  }

  /**
   * Generates the public JWKS for the server.
   */
  async getPublicJWKS(): Promise<{ keys: JWK[] }> {
    const activeKeys = await db.select().from(serverKeys).where(eq(serverKeys.isActive, true));
    
    const keys = await Promise.all(activeKeys.map(async (k) => {
      const decrypted = decryptKey({
        encryptedKey: k.encryptedKey,
        iv: k.iv,
        authTag: k.authTag,
      });
      const privateKey = await jose.importPKCS8(decrypted.toString(), this.algorithm);
      const publicKey = await jose.exportJWK(privateKey); // Simplified export
      return {
        ...publicKey,
        kid: k.id,
        use: 'sig',
        alg: this.algorithm,
      } as JWK;
    }));

    return { keys };
  }

  /**
   * Calculates the S256 thumbprint (jkt) of a JWK.
   */
  async calculateThumbprint(jwk: JWK): Promise<string> {
    return await jose.calculateJwkThumbprint(jwk);
  }
}
