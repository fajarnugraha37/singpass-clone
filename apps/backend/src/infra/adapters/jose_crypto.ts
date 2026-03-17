import * as jose from 'jose';
import type { JWK } from 'jose';
import type { CryptoService } from '../../core/domain/crypto_service';
import type { ClientRegistry } from '../../core/domain/client_registry';
import type { SecurityAuditService } from '../../core/domain/audit_service';
import type { ServerKeyManager } from '../../core/domain/key_manager';
import { getSigningKey, getPublicJWK } from '../../core/security/jwt_utils';
import { sharedConfig } from '../../../../../packages/shared/src/config';

/**
 * Production-grade implementation of CryptoService using jose and ServerKeyManager.
 * Follows SOLID principles by delegating key lifecycle to KeyManager.
 * 
 * HARDENING: Falls back to Environment Variables (OIDC_PRIVATE_KEY) for production deployments
 * to ensure cryptographic keys are never stored in the database if configured via ENV.
 */
export class JoseCryptoService implements CryptoService {
  private algorithm = 'ES256';

  constructor(
    private keyManager: ServerKeyManager,
    private clientRegistry: ClientRegistry,
    private auditService?: SecurityAuditService
  ) {}

  private async useEnvKeys(): Promise<boolean> {
    return !!process.env.OIDC_PRIVATE_KEY && !process.env.OIDC_PRIVATE_KEY.includes('-----BEGIN PRIVATE KEY-----\\n...');
  }

  async generateKeyPair(): Promise<{ id: string; privateKey: Uint8Array; publicKey: JWK }> {
    if (await this.useEnvKeys()) {
      const { key, kid } = await getSigningKey();
      const jwk = await getPublicJWK();
      const exported = await jose.exportPKCS8(key);
      return { id: kid, privateKey: Buffer.from(exported), publicKey: jwk };
    }
    const result = await this.keyManager.generateKeyPair();
    const { privateKey } = await this.keyManager.getActiveKey(result.id);
    
    // Convert CryptoKey to Uint8Array for the interface if necessary
    const exported = await jose.exportPKCS8(privateKey);
    return {
      id: result.id,
      privateKey: Buffer.from(exported),
      publicKey: result.publicKey,
    };
  }

  async sign(payload: Record<string, any>, keyId?: string): Promise<string> {
    if (await this.useEnvKeys()) {
      const { key, kid } = await getSigningKey();
      return await new jose.SignJWT(payload)
        .setProtectedHeader({ alg: this.algorithm, kid })
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(key);
    }
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
    let signingKey: jose.CryptoKey;
    let kid: string;

    if (await this.useEnvKeys()) {
      const envKey = await getSigningKey();
      signingKey = envKey.key;
      kid = envKey.kid;
    } else {
      const activeKey = await this.keyManager.getActiveKey(serverKeyId);
      signingKey = activeKey.privateKey;
      kid = activeKey.id;
    }

    // 1. Sign (JWS)
    const jws = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: this.algorithm, kid })
      .setIssuedAt()
      .sign(signingKey);

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
      // Hardening: iss must match sub
      if (payload.iss !== payload.sub) {
        throw new Error('iss must match sub in client_assertion');
      }

      // Hardening: exp - iat must be <= 120 seconds
      if (payload.exp && payload.iat && payload.exp - payload.iat > 120) {
        throw new Error('client_assertion duration too long (max 120s)');
      }

      // Hardening: aud must match issuer
      if (payload.aud !== sharedConfig.OIDC.ISSUER) {
        throw new Error(`client_assertion aud must be ${sharedConfig.OIDC.ISSUER}`);
      }

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
    let signingKey: jose.CryptoKey;
    let kid: string;

    if (await this.useEnvKeys()) {
      const envKey = await getSigningKey();
      signingKey = envKey.key;
      kid = envKey.kid;
    } else {
      const activeKey = await this.keyManager.getActiveKey();
      signingKey = activeKey.privateKey;
      kid = activeKey.id;
    }
    
    // Production grade: include more context in the nonce if needed, 
    // but typically a signed JWT with clientId and short expiry is standard for DPoP.
    return await new jose.SignJWT({ clientId })
      .setProtectedHeader({ alg: this.algorithm, kid })
      .setIssuedAt()
      .setExpirationTime('15m')
      .sign(signingKey);
  }

  async validateDPoPNonce(nonce: string, clientId: string): Promise<boolean> {
    const { keys } = await this.getPublicJWKS();
    
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
  async getPublicJWKS() { 
    if (await this.useEnvKeys()) {
      const jwk = await getPublicJWK();
      return { keys: [jwk] };
    }
    return this.keyManager.getPublicJWKS(); 
  }
  async ensureActiveKey() { if (!(await this.useEnvKeys())) return this.keyManager.ensureActiveKey(); }
  async rotateKeys() { if (!(await this.useEnvKeys())) return this.keyManager.rotateKeys(); }
  
  async getActiveKey(keyId?: string) { 
    if (await this.useEnvKeys()) {
      const { key, kid } = await getSigningKey();
      const jwk = await getPublicJWK();
      return { id: kid, privateKey: key as jose.CryptoKey, publicKey: jwk };
    }
    return this.keyManager.getActiveKey(keyId); 
  }
  
  async calculateThumbprint(jwk: JWK): Promise<string> {
    return await jose.calculateJwkThumbprint(jwk);
  }

  async validateRedirectUri(clientId: string, redirectUri: string): Promise<boolean> {
    const client = await this.clientRegistry.getClientConfig(clientId);
    return client?.redirectUris?.includes(redirectUri) ?? false;
  }
}
