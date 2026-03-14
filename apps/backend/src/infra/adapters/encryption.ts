import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

export interface EncryptedData {
  encryptedKey: string;
  iv: string;
  authTag: string;
}

/**
 * Gets the encryption secret, falling back to a default only in non-production.
 */
function getSecret(): string {
  const secret = process.env.SERVER_KEY_ENCRYPTION_SECRET;
  if (secret && Buffer.from(secret, 'hex').length === 32) {
    return secret;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('CRITICAL SECURITY ERROR: SERVER_KEY_ENCRYPTION_SECRET must be set in production!');
  }

  return '00'.repeat(32); // Dev fallback
}

/**
 * Encrypts a private key using AES-256-GCM.
 */
export function encryptKey(plainKey: string | Buffer): EncryptedData {
  const secret = getSecret();
  const key = Buffer.from(secret, 'hex');
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(typeof plainKey === 'string' ? plainKey : Buffer.from(plainKey)),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return {
    encryptedKey: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
  };
}

/**
 * Decrypts an encrypted key using AES-256-GCM.
 */
export function decryptKey(data: EncryptedData): Buffer {
  const secret = getSecret();
  const key = Buffer.from(secret, 'hex');
  const iv = Buffer.from(data.iv, 'base64');
  const authTag = Buffer.from(data.authTag, 'base64');
  const encryptedKey = Buffer.from(data.encryptedKey, 'base64');

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encryptedKey),
    decipher.final(),
  ]);

  return decrypted;
}
