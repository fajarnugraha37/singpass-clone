import * as jose from 'jose';

export interface CachedJWKS {
  keys: jose.JWK[];
  expiresAt: number;
}

export class JWKSCacheService {
  private cache: Map<string, CachedJWKS> = new Map();
  private ttlSeconds: number;

  constructor(ttlSeconds: number = 3600) {
    this.ttlSeconds = ttlSeconds;
  }

  /**
   * Gets the encryption key for a client from its JWKS.
   * Fetches from the client's jwks_uri if not in cache or expired.
   */
  async getClientEncryptionKey(
    clientId: string,
    jwksUri: string,
    kid?: string
  ): Promise<jose.JWK> {
    const now = Date.now();
    let cached = this.cache.get(clientId);

    if (!cached || cached.expiresAt < now) {
      const response = await fetch(jwksUri);
      if (!response.ok) {
        throw new Error(`Failed to fetch JWKS from ${jwksUri}: ${response.statusText}`);
      }
      const jwks = await response.json();
      cached = {
        keys: jwks.keys,
        expiresAt: now + this.ttlSeconds * 1000,
      };
      this.cache.set(clientId, cached);
    }

    // Find the key with use='enc' or matching kid
    const key = cached.keys.find((k) => {
      if (kid) return k.kid === kid;
      return k.use === 'enc' || k.key_ops?.includes('encrypt');
    });

    if (!key) {
      throw new Error(`No suitable encryption key found for client ${clientId}`);
    }

    return key;
  }

  /**
   * Manually invalidate cache for a client.
   */
  invalidate(clientId: string): void {
    this.cache.delete(clientId);
  }
}

// Export a singleton instance if needed, or instantiate in the controller/usecase
export const jwksCache = new JWKSCacheService();
