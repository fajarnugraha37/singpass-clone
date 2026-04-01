import { describe, expect, it, mock, beforeEach } from 'bun:test';
import * as jose from 'jose';
import { SingpassNDIAdapter } from '../../src/infra/adapters/singpass-ndi.adapter';
import { resetKeyCache } from '../../src/core/security/jwt_utils';

describe('SingpassNDIAdapter', () => {
  let adapter: SingpassNDIAdapter;
  let mockKeyManager: any;

  beforeEach(async () => {
    resetKeyCache();
    // Generate a valid ES256 key for testing
    const { privateKey, publicKey } = await jose.generateKeyPair('ES256', { extractable: true });
    
    mockKeyManager = {
      getActiveKey: mock(async () => ({
        id: 'test-key-id',
        privateKey: privateKey,
        publicKey: await jose.exportJWK(publicKey)
      }))
    };

    process.env.SINGPASS_CLIENT_ID = 'test-client-id';
    adapter = new SingpassNDIAdapter(mockKeyManager);
    
    // Reset global fetch mock
    global.fetch = mock(() => Promise.resolve(new Response(JSON.stringify({}))));
  });

  it('should push authorization request', async () => {
    global.fetch = mock(() => Promise.resolve(new Response(JSON.stringify({
      request_uri: 'urn:test:123',
      expires_in: 60
    }), { status: 201 })));

    const dpopKey = await jose.generateKeyPair('ES256');
    const result = await adapter.pushAuthorizationRequest('test-client-id', {
      state: 'state',
      nonce: 'nonce'
    }, dpopKey);

    expect(result.request_uri).toBe('urn:test:123');
    expect(global.fetch).toHaveBeenCalled();
  });

  it('should exchange token', async () => {
    global.fetch = mock(() => Promise.resolve(new Response(JSON.stringify({
      access_token: 'at',
      id_token: 'it'
    }), { status: 200 })));

    const dpopKey = await jose.generateKeyPair('ES256');
    const result = await adapter.exchangeToken('test-client-id', 'code', 'verifier', dpopKey);

    expect(result.access_token).toBe('at');
    expect(global.fetch).toHaveBeenCalled();
  });

  it('should get userinfo', async () => {
    global.fetch = mock(() => Promise.resolve(new Response(JSON.stringify({
      sub: 'user1'
    }), { status: 200 })));

    const dpopKey = await jose.generateKeyPair('ES256');
    const result = await adapter.getUserInfo('token', dpopKey);

    expect(result.sub).toBe('user1');
    expect(global.fetch).toHaveBeenCalled();
  });
});
