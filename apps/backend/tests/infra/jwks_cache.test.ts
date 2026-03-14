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
      } as Response;
    });

    const key = await cacheService.getClientEncryptionKey('client-1', 'https://example.com/jwks');
    expect(key.kid).toBe('key-1');
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Second call should hit cache
    const key2 = await cacheService.getClientEncryptionKey('client-1', 'https://example.com/jwks');
    expect(key2.kid).toBe('key-1');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('should throw error if fetch fails', async () => {
    spyOn(globalThis, 'fetch').mockImplementation(async () => {
      return {
        ok: false,
        statusText: 'Not Found',
      } as Response;
    });

    await expect(cacheService.getClientEncryptionKey('client-1', 'https://example.com/404'))
      .rejects.toThrow('Failed to fetch JWKS');
  });

  it('should throw error if no encryption key found', async () => {
    spyOn(globalThis, 'fetch').mockImplementation(async () => {
      return {
        ok: true,
        json: async () => ({ keys: [{ kid: 'sig-only', use: 'sig' }] }),
      } as Response;
    });

    await expect(cacheService.getClientEncryptionKey('client-1', 'https://example.com/sig-only'))
      .rejects.toThrow('No suitable encryption key found');
  });

  it('should invalidate cache', async () => {
    const fetchMock = spyOn(globalThis, 'fetch').mockImplementation(async () => {
      return { ok: true, json: async () => mockJwks } as Response;
    });

    await cacheService.getClientEncryptionKey('client-1', 'https://example.com/jwks');
    cacheService.invalidate('client-1');
    await cacheService.getClientEncryptionKey('client-1', 'https://example.com/jwks');

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
