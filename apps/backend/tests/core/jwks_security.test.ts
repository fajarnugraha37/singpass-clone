import { describe, it, expect, beforeAll } from 'bun:test';
import * as jose from 'jose';
import { JoseCryptoService } from '../../src/infra/adapters/jose_crypto';
import { DrizzleServerKeyManager } from '../../src/infra/adapters/db/drizzle_key_manager';

describe('JWKS Security Audit', () => {
  let cryptoService: JoseCryptoService;
  let keyManager: DrizzleServerKeyManager;

  beforeAll(async () => {
    process.env.SERVER_KEY_ENCRYPTION_SECRET = '00'.repeat(32);
    keyManager = new DrizzleServerKeyManager();
    cryptoService = new JoseCryptoService(keyManager);
  });

  it('should not expose private key components in JWKS', async () => {
    // 1. Generate server key
    await cryptoService.ensureActiveKey();
    
    // 2. Get public JWKS
    const { keys } = await cryptoService.getPublicJWKS();
    
    expect(keys.length).toBeGreaterThan(0);
    
    for (const key of keys) {
      // Private components for EC keys (ES256)
      expect(key.d).toBeUndefined();
      
      // Additional RSA private components (if any were added later)
      expect(key.p).toBeUndefined();
      expect(key.q).toBeUndefined();
      expect(key.dp).toBeUndefined();
      expect(key.dq).toBeUndefined();
      expect(key.qi).toBeUndefined();
      
      // Required components for public EC key
      expect(key.kty).toBe('EC');
      expect(key.crv).toBe('P-256');
      expect(key.x).toBeDefined();
      expect(key.y).toBeDefined();
    }
  });
});
