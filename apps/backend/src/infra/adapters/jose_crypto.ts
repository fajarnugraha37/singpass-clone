import * as jose from 'jose';
import type { JWK } from 'jose';
import type { CryptoService } from '../../core/domain/crypto_service';
import { db } from '../database/client';
import * as schema from '../database/schema';
import { sharedConfig } from '../../../../../packages/shared/src/config';
import { getClientConfig } from './client_registry';
import type { SecurityAuditService } from '../../core/domain/audit_service';
import type { ServerKeyManager } from '../../core/domain/key_manager';
import { and, eq } from 'drizzle-orm';
/**
 * Production-grade implementation of CryptoService using jose and ServerKeyManager.
 * Follows SOLID principles by delegating key lifecycle to KeyManager.
 */
export class JoseCryptoService implements CryptoService {
  private algorithm = 'ES256';

  constructor(
    private keyManager: ServerKeyManager,
    private auditService?: SecurityAuditService
  ) {}

  async generateKeyPair(): Promise<{ id: string; privateKey: Uint8Array; publicKey: JWK }> {
    // This is now primarily used for initial setup or tests.
    // The privateKey return is for legacy/internal consistency if needed.
    const result = await this.keyManager.generateKeyPair();
    const { privateKey } = await this.keyManager.getActiveKey(result.id);
    
    // Convert KeyLike to Uint8Array for the interface if necessary
    const exported = await jose.exportPKCS8(privateKey);
    return {
      id: result.id,
      privateKey: Buffer.from(exported),
      publicKey: result.publicKey,
    };
  }

  async sign(payload: Record<string, any>, keyId?: string): Promise<string> {
    const { id: kid, privateKey } = await this.keyManager.getActiveKey(keyId);
    
    return await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: this.algorithm, kid })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(privateKey);
  }

  async signAndEncrypt(
    payload: Record<string, any>,
    clientPublicKey: JWK,
    serverKeyId?: string
  ): Promise<string> {
    const { id: kid, privateKey } = await this.keyManager.getActiveKey(serverKeyId);

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

  async validateClientAssertion(assertion: string, clientPublicKey: JWK): Promise<boolean> {
    const payload = jose.decodeJwt(assertion);
    const clientId = payload.iss || 'unknown';

    try {
      const publicKey = await jose.importJWK(clientPublicKey, this.algorithm);
      await jose.jwtVerify(assertion, publicKey, {
        algorithms: [this.algorithm],
        clockTolerance: 60,
      });

      await this.auditService?.logEvent({ type: 'CLIENT_AUTH_SUCCESS', severity: 'INFO', clientId });
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



  async generateDPoPNonce(clientId: string): Promise<string> {
    const { id: kid, privateKey } = await this.keyManager.getActiveKey();
    
    // Production grade: include more context in the nonce if needed, 
    // but typically a signed JWT with clientId and short expiry is standard for DPoP.
    return await new jose.SignJWT({ clientId })
      .setProtectedHeader({ alg: this.algorithm, kid })
      .setIssuedAt()
      .setExpirationTime('15m')
      .sign(privateKey);
  }

  async validateDPoPNonce(nonce: string, clientId: string): Promise<boolean> {
    const { keys } = await this.keyManager.getPublicJWKS();
    
    for (const jwk of keys) {
      try {
        const publicKey = await jose.importJWK(jwk, this.algorithm);
        const { payload } = await jose.jwtVerify(nonce, publicKey);
        if (payload.clientId === clientId) return true;
      } catch (e) { /* ignore and try next key */ }
    }
    return false;
  }

  // Delegated methods
  async getPublicJWKS() { return this.keyManager.getPublicJWKS(); }
  async ensureActiveKey() { return this.keyManager.ensureActiveKey(); }
  async rotateKeys() { return this.keyManager.rotateKeys(); }
  async getActiveKey(keyId?: string) { return this.keyManager.getActiveKey(keyId); }
  
  async calculateThumbprint(jwk: JWK): Promise<string> {
    return await jose.calculateJwkThumbprint(jwk);
  }

  async validateRedirectUri(clientId: string, redirectUri: string): Promise<boolean> {
    const client = getClientConfig(clientId);
    return client?.redirectUris.includes(redirectUri) ?? false;
  }
}
