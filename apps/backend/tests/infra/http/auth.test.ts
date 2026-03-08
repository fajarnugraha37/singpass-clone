import { expect, test, describe, beforeEach, spyOn } from 'bun:test'
import app from '../../../src/index'
import { DrizzlePARRepository } from '../../../src/infra/adapters/db/drizzle_par_repository'

describe('Auth Endpoints', () => {
  describe('GET /auth', () => {
    beforeEach(() => {
      // Mock PAR repository to return a valid request for a specific URI
      spyOn(DrizzlePARRepository.prototype, 'getByRequestUri').mockImplementation(async (uri: string) => {
        if (uri === 'urn:ietf:params:oauth:request_uri:valid') {
          return {
            clientId: 'mock-client',
            requestUri: uri,
            payload: { state: 'test-state' },
            expiresAt: new Date(Date.now() + 300000),
          };
        }
        return null;
      });
    });

    test('should redirect to /login and set session cookie for valid request', async () => {
      const res = await app.request('/auth?client_id=mock-client&request_uri=urn:ietf:params:oauth:request_uri:valid');
      
      expect(res.status).toBe(302);
      expect(res.headers.get('Location')).toBe('/login');
      expect(res.headers.get('Set-Cookie')).toContain('vibe_auth_session=');
      expect(res.headers.get('Set-Cookie')).toContain('HttpOnly');
    });

    test('should return 400 if client_id is missing', async () => {
      const res = await app.request('/auth?request_uri=urn:ietf:params:oauth:request_uri:valid');
      expect(res.status).toBe(400);
    });

    test('should return 400 if request_uri is missing', async () => {
      const res = await app.request('/auth?client_id=mock-client');
      expect(res.status).toBe(400);
    });

    test('should return error status if use case fails (invalid/expired URI)', async () => {
      const res = await app.request('/auth?client_id=mock-client&request_uri=urn:ietf:params:oauth:request_uri:invalid');
      // Status code depends on implementation, but should not be 302/200 success
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });
});
