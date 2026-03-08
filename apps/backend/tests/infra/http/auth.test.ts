import { expect, test, describe, beforeEach, spyOn } from 'bun:test'
import app from '../../../src/index'
import { DrizzlePARRepository } from '../../../src/infra/adapters/db/drizzle_par_repository'
import { DrizzleAuthSessionRepository } from '../../../src/infra/adapters/db/drizzle_session_repository'
import { DrizzleAuthorizationCodeRepository } from '../../../src/infra/adapters/db/drizzle_authorization_code_repository'

describe('Auth Endpoints', () => {
  beforeEach(() => {
    // Mock PAR repository to return a valid request for a specific URI
    spyOn(DrizzlePARRepository.prototype, 'getByRequestUri').mockImplementation(async (uri: string) => {
      if (uri === 'urn:ietf:params:oauth:request_uri:valid') {
        return {
          clientId: 'mock-client',
          requestUri: uri,
          dpopJkt: 'test-jkt',
          payload: { 
            state: 'test-state', 
            code_challenge: 'test-challenge', 
            redirect_uri: 'https://client.example.com/cb',
            nonce: 'test-nonce'
          },
          expiresAt: new Date(Date.now() + 300000),
        };
      }
      return null;
    });

    // Mock Session repository
    spyOn(DrizzleAuthSessionRepository.prototype, 'save').mockImplementation(async () => {});
    spyOn(DrizzleAuthSessionRepository.prototype, 'getById').mockImplementation(async (id: string) => {
      if (id === 'valid-session-id') {
        return {
          id,
          clientId: 'mock-client',
          parRequestUri: 'urn:ietf:params:oauth:request_uri:valid',
          status: 'INITIATED',
          expiresAt: new Date(Date.now() + 300000),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
      return null;
    });
    spyOn(DrizzleAuthSessionRepository.prototype, 'update').mockImplementation(async () => {});

    // Mock Auth Code repository
    spyOn(DrizzleAuthorizationCodeRepository.prototype, 'save').mockImplementation(async () => {});
  });

  describe('GET /auth', () => {
    test('should redirect to /login and set session cookie for valid request', async () => {
      const res = await app.request('/auth?client_id=mock-client&request_uri=urn:ietf:params:oauth:request_uri:valid');
      
      expect(res.status).toBe(302);
      expect(res.headers.get('Location')).toBe('/login');
      expect(res.headers.get('Set-Cookie')).toContain('vibe_auth_session=');
      expect(res.headers.get('Set-Cookie')).toContain('HttpOnly');
    });

    test('should redirect to error page if client_id is missing', async () => {
      const res = await app.request('/auth?request_uri=urn:ietf:params:oauth:request_uri:valid');
      expect(res.status).toBe(302);
      expect(res.headers.get('Location')).toContain('/error?error=invalid_request');
    });

    test('should redirect to error page if request_uri is missing', async () => {
      const res = await app.request('/auth?client_id=mock-client');
      expect(res.status).toBe(302);
      expect(res.headers.get('Location')).toContain('/error?error=invalid_request');
    });

    test('should return redirect to error page if use case fails (invalid/expired URI)', async () => {
      const res = await app.request('/auth?client_id=mock-client&request_uri=urn:ietf:params:oauth:request_uri:invalid');
      expect(res.status).toBe(302);
      expect(res.headers.get('Location')).toContain('/error');
      expect(res.headers.get('Location')).toContain('error=invalid_request');
    });
  });

  describe('POST /api/auth/login', () => {
    test('should return 200 and next_step: 2fa for valid credentials', async () => {
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

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.next_step).toBe('2fa');
    });

    test('should return 401 for invalid credentials', async () => {
      const res = await app.request('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'vibe_auth_session=valid-session-id'
        },
        body: JSON.stringify({
          username: 'S1234567A',
          password: 'wrong-password'
        })
      });

      expect(res.status).toBe(401);
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
      let currentStatus = 'PRIMARY_AUTH_SUCCESS';
      
      // Mock Session repository with state for this specific test
      spyOn(DrizzleAuthSessionRepository.prototype, 'getById').mockImplementation(async (id: string) => {
        if (id === 'valid-session-id') {
          return {
            id,
            clientId: 'mock-client',
            parRequestUri: 'urn:ietf:params:oauth:request_uri:valid',
            status: currentStatus as any,
            otpCode: '123456',
            expiresAt: new Date(Date.now() + 300000),
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        }
        return null;
      });

      spyOn(DrizzleAuthSessionRepository.prototype, 'update').mockImplementation(async (session: any) => {
        if (session.id === 'valid-session-id') {
          currentStatus = session.status;
        }
      });

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

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.redirect_uri).toBeDefined();
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
