import { describe, expect, it, mock } from 'bun:test';
import { Hono } from 'hono';
import { getJWKS } from '../../../src/infra/http/controllers/jwks.controller';
import type { CryptoService } from '../../../src/core/domain/crypto_service';

describe('JWKS Controller', () => {
  it('should return 200 and public keys', async () => {
    const mockCryptoService = {
      getPublicJWKS: mock(async () => ({
        keys: [
          {
            kty: 'EC',
            crv: 'P-256',
            x: '...',
            y: '...',
            kid: 'test-sig-kid',
            use: 'sig',
            alg: 'ES256',
          },
          {
            kty: 'EC',
            crv: 'P-256',
            x: '...',
            y: '...',
            kid: 'test-enc-kid',
            use: 'enc',
            alg: 'ES256',
          },
        ],
      })),
    } as unknown as CryptoService;

    const app = new Hono();
    app.get('/.well-known/keys', getJWKS(mockCryptoService));

    const res = await app.request('/.well-known/keys');
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.keys).toHaveLength(2);
    expect(data.keys.find((k: any) => k.use === 'sig')).toBeDefined();
    expect(data.keys.find((k: any) => k.use === 'enc')).toBeDefined();
  });
});
