import * as jose from 'jose';
import type { JWK } from 'jose';
import type { CryptoService } from '../../core/domain/crypto_service';
import { db } from '../database/client';
import * as schema from '../database/schema';
import { serverKeys } from '../database/schema';
import { encryptKey, decryptKey } from './encryption';
import { eq, and } from 'drizzle-orm';
import { sharedConfig } from '../../../../../packages/shared/src/config';
import { getClientConfig } from './client_registry';

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
    const { publicKey, privateKey } = await jose.generateKeyPair(this.algorithm, { extractable: true });
    
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
    const { id: kid, privateKey } = await this.getActiveKey();
    
    return await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: this.algorithm, kid })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(privateKey);
  }

  /**
   * Generates a nested JWS-in-JWE (Signed then Encrypted) payload.
   */
  async signAndEncrypt(
    payload: Record<string, any>,
    clientPublicKey: JWK,
    serverKeyId?: string
  ): Promise<string> {
    const { id: kid, privateKey } = await this.getActiveKey(serverKeyId);

    // 1. Sign (JWS)
    const jws = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: this.algorithm, kid })
      .setIssuedAt()
      .sign(privateKey);

    // 2. Encrypt (JWE)
    const encryptionAlg = (clientPublicKey.alg as string) || 'ECDH-ES+A256KW';
    const publicKey = await jose.importJWK(clientPublicKey, encryptionAlg);

    return await new jose.CompactEncrypt(new TextEncoder().encode(jws))
      .setProtectedHeader({
        alg: encryptionAlg,
        enc: 'A256GCM',
        kid: clientPublicKey.kid,
      })
      .encrypt(publicKey);
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
      // FAPI 2.0 / private_key_jwt validation
      await jose.jwtVerify(assertion, publicKey, {
        algorithms: [this.algorithm],
        clockTolerance: 60, // 1 minute skew tolerance
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
    expectedUrl: string,
    clientId: string,
    expectedNonce?: string
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

    if (expectedNonce && payload.nonce !== expectedNonce) {
      throw new Error(`DPoP nonce mismatch: expected ${expectedNonce}, got ${payload.nonce}`);
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

    const [existingJti] = await db.select()
      .from(schema.usedJtis)
      .where(and(
        eq(schema.usedJtis.jti, payload.jti as string),
        eq(schema.usedJtis.clientId, clientId)
      ))
      .limit(1);

    if (existingJti) {
      await this.auditService?.logEvent({
        type: 'DPOP_VALIDATION_FAIL',
        severity: 'ERROR',
        details: { jti: payload.jti, reason: 'Replay attack detected' },
        clientId,
      });
      throw new Error('DPoP proof jti already used (replay attack)');
    }

    // Insert JTI to prevent reuse
    await db.insert(schema.usedJtis).values({
      jti: payload.jti as string,
      clientId,
      expiresAt: new Date(Date.now() + ttl * 1000),
    });

    const jkt = await jose.calculateJwkThumbprint(header.jwk as JWK);

    await this.auditService?.logEvent({
      type: 'DPOP_VALIDATION_SUCCESS',
      severity: 'INFO',
      details: { jti: payload.jti, jkt },
      clientId,
    });

    return { jkt };
  }

  /**
   * Generates a new DPoP-Nonce for a client.
   * Simple implementation: signed payload with clientId and expiry.
   */
  async generateDPoPNonce(clientId: string): Promise<string> {
    const query = db.select().from(serverKeys).where(eq(serverKeys.isActive, true)).limit(1);
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

    return await new jose.SignJWT({ clientId })
      .setProtectedHeader({ alg: this.algorithm, kid: keyRecord.id })
      .setIssuedAt()
      .setExpirationTime('15m') // DPoP nonces are typically short-lived
      .sign(privateKey);
  }

  /**
   * Validates a DPoP-Nonce.
   */
  async validateDPoPNonce(nonce: string, clientId: string): Promise<boolean> {
    const activeKeys = await db.select().from(serverKeys).where(eq(serverKeys.isActive, true));
    
    // Nonce could have been signed by any active key (or recently deactivated key, but we'll stick to active for simplicity)
    for (const keyRecord of activeKeys) {
      try {
        const decryptedPrivateKey = decryptKey({
          encryptedKey: keyRecord.encryptedKey,
          iv: keyRecord.iv,
          authTag: keyRecord.authTag,
        });
        const privateKey = await jose.importPKCS8(decryptedPrivateKey.toString(), this.algorithm);
        
        // We need the public key to verify
        const publicKey = await jose.importSPKI(
          (await jose.exportSPKI(await jose.importPKCS8(decryptedPrivateKey.toString(), this.algorithm))), 
          this.algorithm
        );
        // Actually, jose.jwtVerify needs a KeyLike public key
        // Let's just use importPKCS8 then export/import public key is a bit much.
        // Better: jose.jwtVerify can take a Secret but we have ES256.
        
        // Let's use the public key from the record if we had it. But we only store encrypted private key.
        // We can derive public key from private key.
        const { payload } = await jose.jwtVerify(nonce, publicKey);
        
        if (payload.clientId === clientId) {
          return true;
        }
      } catch (e) {
        // Continue to next key
      }
    }
    return false;
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

  /**
   * Validates exact redirect_uri against client registry.
   */
  async validateRedirectUri(clientId: string, redirectUri: string): Promise<boolean> {
    const client = getClientConfig(clientId);
    if (!client) return false;
    return client.redirectUris.includes(redirectUri);
  }

  /**
   * Returns an active server key for signing or encryption.
   */
  async getActiveKey(keyId?: string): Promise<{ id: string; privateKey: jose.KeyLike; publicKey: JWK }> {
    const query = keyId
      ? db.select().from(serverKeys).where(eq(serverKeys.id, keyId))
      : db.select().from(serverKeys).where(eq(serverKeys.isActive, true)).limit(1);

    const [keyRecord] = await query;
    if (!keyRecord) {
      throw new Error(keyId ? `Key ${keyId} not found` : 'No active signing key found');
    }

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
        use: 'sig',
        alg: this.algorithm,
      } as JWK,
    };
  }
}
