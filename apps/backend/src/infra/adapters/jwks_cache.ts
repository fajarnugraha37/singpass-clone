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
   * Fetches and caches JWKS from a URI.
   * Respects Cache-Control: max-age and Expires headers.
   */
  private async fetchAndCache(clientId: string, jwksUri: string): Promise<CachedJWKS> {
    const response = await fetch(jwksUri);
    if (!response.ok) {
      throw new Error(`Failed to fetch JWKS from ${jwksUri}: ${response.statusText}`);
    }

    const jwks = await response.json();
    let ttl = this.ttlSeconds;

    // Parse Cache-Control: max-age
    const cacheControl = response.headers.get('Cache-Control');
    if (cacheControl) {
      const match = cacheControl.match(/max-age=(\d+)/);
      if (match) {
        ttl = parseInt(match[1], 10);
      }
    } else {
      // Parse Expires header
      const expires = response.headers.get('Expires');
      if (expires) {
        const expiresDate = new Date(expires);
        if (!isNaN(expiresDate.getTime())) {
          ttl = Math.floor((expiresDate.getTime() - Date.now()) / 1000);
        }
      }
    }

    // Minimum TTL of 60 seconds (FR-008)
    if (ttl < 60) ttl = 60;

    const cached: CachedJWKS = {
      keys: jwks.keys,
      expiresAt: Date.now() + ttl * 1000,
    };

    this.cache.set(clientId, cached);
    return cached;
  }

  /**
   * Gets all keys for a client.
   */
  async getClientKeys(clientId: string, jwksUri: string): Promise<jose.JWK[]> {
    const now = Date.now();
    let cached = this.cache.get(clientId);

    if (!cached || cached.expiresAt < now) {
      cached = await this.fetchAndCache(clientId, jwksUri);
    }

    return cached.keys;
  }

  /**
   * Gets the encryption key for a client from its JWKS.
   */
  async getClientEncryptionKey(
    clientId: string,
    jwksUri: string,
    kid?: string
  ): Promise<jose.JWK> {
    const keys = await this.getClientKeys(clientId, jwksUri);

    // Find the key with use='enc' or matching kid
    const key = keys.find((k) => {
      if (kid) return k.kid === kid;
      return k.use === 'enc' || k.key_ops?.includes('encrypt');
    });

    if (!key) {
      throw new Error(`No suitable encryption key found for client ${clientId}`);
    }

    return key;
  }

  /**
   * Gets a signing key for a client from its JWKS.
   */
  async getClientSigningKey(
    clientId: string,
    jwksUri: string,
    kid?: string
  ): Promise<jose.JWK> {
    const keys = await this.getClientKeys(clientId, jwksUri);

    const key = keys.find((k) => {
      if (kid) return k.kid === kid;
      return k.use === 'sig' || k.key_ops?.includes('verify');
    });

    if (!key) {
      throw new Error(`No suitable signing key found for client ${clientId}`);
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
