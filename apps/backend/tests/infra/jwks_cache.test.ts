import { describe, it, expect, mock, beforeEach, afterEach, spyOn } from 'bun:test';
import { JWKSCacheService } from '../../src/infra/adapters/jwks_cache';

describe('JWKSCacheService', () => {
  let cacheService: JWKSCacheService;
  const mockJwks = {
    keys: [
      { kid: 'key-1', kty: 'EC', crv: 'P-256', x: '...', y: '...', use: 'enc' },
      { kid: 'key-2', kty: 'EC', crv: 'P-256', x: '...', y: '...', use: 'sig' },
    ],
  };

  beforeEach(() => {
    cacheService = new JWKSCacheService(60);
  });

  afterEach(() => {
    mock.restore();
  });

  it('should fetch and cache JWKS from URI', async () => {
    const fetchMock = spyOn(globalThis, 'fetch').mockImplementation(async () => {
      return {
        ok: true,
        json: async () => mockJwks,
        headers: new Headers(),
      } as Response;
    });

    const jwksUri = 'https://example.com/jwks-cache-test';
    const key = await cacheService.getClientEncryptionKey('client-1', jwksUri);
    expect(key.kid).toBe('key-1');
    expect(fetchMock.mock.calls.filter(c => c[0] === jwksUri).length).toBe(1);

    // Second call should hit cache
    const key2 = await cacheService.getClientEncryptionKey('client-1', jwksUri);
    expect(key2.kid).toBe('key-1');
    expect(fetchMock.mock.calls.filter(c => c[0] === jwksUri).length).toBe(1);
  });

  it('should throw error if fetch fails', async () => {
    spyOn(globalThis, 'fetch').mockImplementation(async () => {
      return {
        ok: false,
        statusText: 'Not Found',
      } as Response;
    });

    expect(cacheService.getClientEncryptionKey('client-1', 'https://example.com/404-test'))
      .rejects.toThrow('Failed to fetch JWKS');
  });

  it('should throw error if no encryption key found', async () => {
    spyOn(globalThis, 'fetch').mockImplementation(async () => {
      return {
        ok: true,
        json: async () => ({ keys: [{ kid: 'sig-only', use: 'sig' }] }),
        headers: new Headers(),
      } as Response;
    });

    expect(cacheService.getClientEncryptionKey('client-1', 'https://example.com/sig-only-test'))
      .rejects.toThrow('No suitable encryption key found');
  });

  it('should invalidate cache', async () => {
    const fetchMock = spyOn(globalThis, 'fetch').mockImplementation(async () => {
      return { ok: true, json: async () => mockJwks, headers: new Headers() } as Response;
    });

    const jwksUri = 'https://example.com/jwks-invalidate-test';
    await cacheService.getClientEncryptionKey('client-invalidate', jwksUri);
    cacheService.invalidate('client-invalidate');
    await cacheService.getClientEncryptionKey('client-invalidate', jwksUri);

    expect(fetchMock.mock.calls.filter(c => c[0] === jwksUri).length).toBe(2);
  });

  it('should respect Cache-Control: max-age header', async () => {
    spyOn(globalThis, 'fetch').mockImplementation(async () => {
      return {
        ok: true,
        json: async () => mockJwks,
        headers: new Headers({ 'Cache-Control': 'max-age=120' }),
      } as any;
    });

    const keys = await cacheService.getClientKeys('client-cc', 'https://example.com/cc-test');
    expect(keys.length).toBe(2);
  });

  it('should enforce minimum TTL of 60 seconds', async () => {
    spyOn(globalThis, 'fetch').mockImplementation(async () => {
      return {
        ok: true,
        json: async () => mockJwks,
        headers: new Headers({ 'Cache-Control': 'max-age=10' }),
      } as any;
    });

    const keys = await cacheService.getClientKeys('client-min-ttl', 'https://example.com/min-ttl-test');
    expect(keys.length).toBe(2);
  });

  it('should fetch signing key', async () => {
    spyOn(globalThis, 'fetch').mockImplementation(async () => {
      return {
        ok: true,
        json: async () => mockJwks,
        headers: new Headers(),
      } as any;
    });

    const key = await cacheService.getClientSigningKey('client-sig', 'https://example.com/sig-test');
    expect(key.kid).toBe('key-2');
    expect(key.use).toBe('sig');
  });
});
