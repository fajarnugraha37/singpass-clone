import type { JWK, CryptoKey } from 'jose';

export interface KeyRecord {
  id: string;
  encryptedKey: string;
  iv: string;
  authTag: string;
  isActive: boolean;
  createdAt: Date;
}

export interface ServerKeyManager {
  /**
   * Generates and persists a new server key pair.
   */
  generateKeyPair(): Promise<{ id: string; publicKey: JWK }>;

  /**
   * Returns all active public keys in JWKS format.
   * Skips keys that cannot be decrypted.
   */
  getPublicJWKS(): Promise<{ keys: JWK[] }>;

  /**
   * Returns a single active key (private and public).
   */
  getActiveKey(keyId?: string): Promise<{ id: string; privateKey: CryptoKey; publicKey: JWK }>;

  /**
   * Ensures at least one decryptable active key exists.
   */
  ensureActiveKey(): Promise<void>;

  /**
   * Handles periodic rotation and deactivation.
   */
  rotateKeys(): Promise<void>;
  
  /**
   * Purges old inactive keys from storage.
   */
  purgeOldKeys(daysToKeep: number): Promise<number>;
}
