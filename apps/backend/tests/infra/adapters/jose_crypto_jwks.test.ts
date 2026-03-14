import { describe, it, expect, beforeAll } from 'bun:test';
import { JoseCryptoService } from '../../../src/infra/adapters/jose_crypto';

describe('JoseCryptoService: getPublicJWKS Security', () => {
  let cryptoService: JoseCryptoService;

  beforeAll(async () => {
    // Ensure environment is set up for encryption
    process.env.SERVER_KEY_ENCRYPTION_SECRET = '00'.repeat(32);
    cryptoService = new JoseCryptoService();
  });

  it('should NOT include private key components (d) in exported JWKS', async () => {
    // 1. Generate a key pair to ensure there's at least one active key
    await cryptoService.generateKeyPair();

    // 2. Fetch public JWKS
    const jwks = await cryptoService.getPublicJWKS();

    // 3. Assertions
    expect(jwks.keys).toBeDefined();
    expect(jwks.keys.length).toBeGreaterThan(0);

    for (const key of jwks.keys) {
      expect(key.d).toBeUndefined(); // This is the critical security check
      expect(key.p).toBeUndefined();
      expect(key.q).toBeUndefined();
      expect(key.dp).toBeUndefined();
      expect(key.dq).toBeUndefined();
      expect(key.qi).toBeUndefined();
      
      // Public components should be present
      expect(key.kty).toBeDefined();
      expect(key.kid).toBeDefined();
      if (key.kty === 'EC') {
        expect(key.x).toBeDefined();
        expect(key.y).toBeDefined();
      }
    }
  });
});
