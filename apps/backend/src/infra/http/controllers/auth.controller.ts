import { Context } from 'hono';
import { setCookie, getCookie } from 'hono/cookie';
import { InitiateAuthSessionUseCase } from '../../../core/use-cases/InitiateAuthSession';
import { ValidateLoginUseCase } from '../../../core/use-cases/ValidateLogin';
import { Validate2FAUseCase } from '../../../core/use-cases/Validate2FA';

export const initiateAuth = (useCase: InitiateAuthSessionUseCase) => {
  return async (c: Context) => {
    try {
      const clientId = c.req.query('client_id');
      const requestUri = c.req.query('request_uri');

      if (!clientId || !requestUri) {
        return c.text('Missing client_id or request_uri', 400);
      }

      const result = await useCase.execute({ clientId, requestUri });

      // Set secure HTTP-only session cookie
      setCookie(c, 'vibe_auth_session', result.sessionId, {
        httpOnly: true,
        secure: true, // Should be true in production
        sameSite: 'Lax',
        maxAge: 300, // 5 minutes (matching PAR expiry)
        path: '/',
      });

      return c.redirect(result.redirectUri);
    } catch (error: any) {
      console.error('[Auth Initiation] Error:', error);
      return c.text(`Invalid request: ${error.message}`, 400);
    }
  };
};

export const login = (useCase: ValidateLoginUseCase) => {
  return async (c: Context) => {
    try {
      const sessionId = getCookie(c, 'vibe_auth_session');
      if (!sessionId) {
        return c.json({ success: false, error: 'Session not found' }, 401);
      }

      const { username, password } = await c.req.json();
      const result = await useCase.execute({ sessionId, username, password });

      if (!result.success) {
        return c.json(result, 401);
      }

      return c.json(result, 200);
    } catch (error: any) {
      console.error('[Login] Error:', error);
      return c.json({ success: false, error: 'Internal server error' }, 500);
    }
  };
};

export const twoFactor = (useCase: Validate2FAUseCase) => {
  return async (c: Context) => {
    try {
      const sessionId = getCookie(c, 'vibe_auth_session');
      if (!sessionId) {
        return c.json({ success: false, error: 'Session not found' }, 401);
      }

      const { otp } = await c.req.json();
      const result = await useCase.execute({ sessionId, otp });

      if (!result.success) {
        return c.json(result, 401);
      }

      return c.json(result, 200);
    } catch (error: any) {
      console.error('[2FA] Error:', error);
      return c.json({ success: false, error: 'Internal server error' }, 500);
    }
  };
};
