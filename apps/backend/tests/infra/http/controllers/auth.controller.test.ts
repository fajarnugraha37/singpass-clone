import { describe, it, expect, mock } from 'bun:test';
import { Hono } from 'hono';
import { getSession } from '../../../../src/infra/http/controllers/auth.controller';

describe('Auth Controller - getSession', () => {
  const mockSessionRepository = {
    getById: mock(async (id: string) => {
      if (id === 'valid-session') {
        return {
          id: 'valid-session',
          clientId: 'test-client',
          purpose: 'test-purpose',
          status: 'authenticated',
          expiresAt: new Date(Date.now() + 10000),
          parRequestUri: 'urn:ietf:params:oauth:request_uri:123',
        };
      }
      return null;
    }),
    save: mock(async () => {}),
    delete: mock(async () => {}),
    updateStatus: mock(async () => {}),
  };

  const mockClientRegistry = {
    getClientConfig: mock(async (id: string) => {
      if (id === 'test-client') {
        return {
          clientId: 'test-client',
          clientName: 'Test Application',
          redirectUris: ['http://localhost:4321/callback'],
          responseTypes: ['code'],
          grantTypes: ['authorization_code'],
          tokenEndpointAuthMethod: 'private_key_jwt',
        };
      }
      return null;
    }),
  };

  it('should return session info for a valid session cookie', async () => {
    const app = new Hono().get('/session', getSession(mockSessionRepository as any, mockClientRegistry as any));

    const res = await app.request('/session', {
      headers: {
        cookie: 'vibe_auth_session=valid-session',
      },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.clientId).toBe('test-client');
    expect(data.clientName).toBe('Test Application');
    expect(data.status).toBe('authenticated');
  });

  it('should return 401 if session cookie is missing', async () => {
    const app = new Hono().get('/session', getSession(mockSessionRepository as any, mockClientRegistry as any));

    const res = await app.request('/session');

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Session not found');
  });

  it('should return 401 if session ID is invalid', async () => {
    const app = new Hono().get('/session', getSession(mockSessionRepository as any, mockClientRegistry as any));

    const res = await app.request('/session', {
      headers: {
        cookie: 'vibe_auth_session=invalid-session',
      },
    });

    expect(res.status).toBe(401);
  });
});
