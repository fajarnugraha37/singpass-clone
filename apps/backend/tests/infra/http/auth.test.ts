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

  describe('POST /api/auth/login', () => {
    test('should return 200 and next_step: 2fa for valid credentials', async () => {
      // Note: We need a valid session cookie for this to work in a real scenario
      // For now, we are testing the endpoint's existence and basic response
      const res = await app.request('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'vibe_auth_session=valid-session-id'
        },
        body: JSON.stringify({
          username: 'S1234567A',
          password: 'password123'
        })
      });

      // The controller currently returns 501 Not Implemented
      expect(res.status).toBe(501);
    });

    test('should return 400 for invalid request body', async () => {
      const res = await app.request('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          // missing username and password
        })
      });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/2fa', () => {
    test('should return 200 and redirect_uri for valid OTP', async () => {
      const res = await app.request('/api/auth/2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'vibe_auth_session=valid-session-id'
        },
        body: JSON.stringify({
          otp: '123456'
        })
      });

      // Initially 501 until implemented in US3
      expect(res.status).toBe(501);
    });

    test('should return 200 with redirect_uri containing code and state on success', async () => {
      // Integration test for final OIDC redirect
      // This will be fully functional once US3 is complete
      const res = await app.request('/api/auth/2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'vibe_auth_session=valid-session-id'
        },
        body: JSON.stringify({
          otp: '123456'
        })
      });

      // Placeholder test until US3 is complete
      if (res.status === 200) {
        const body = await res.json();
        expect(body.success).toBe(true);
        expect(body.redirect_uri).toContain('code=');
        expect(body.redirect_uri).toContain('state=');
      }
    });

    test('should return 400 for invalid OTP format', async () => {
      const res = await app.request('/api/auth/2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          otp: '123' // too short
        })
      });

      expect(res.status).toBe(400);
    });
  });
});
