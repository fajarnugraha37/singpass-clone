import { Context } from 'hono';
import { setCookie } from 'hono/cookie';
import { InitiateAuthSessionUseCase } from '../../../core/use-cases/InitiateAuthSession';

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
      // OIDC error response format or generic error page
      return c.text(`Invalid request: ${error.message}`, 400);
    }
  };
};

export const login = () => {
  return async (c: Context) => {
    // T018 implementation placeholder
    return c.json({ success: false, error: 'Not implemented' }, 501);
  };
};

export const twoFactor = () => {
  return async (c: Context) => {
    // T019 implementation placeholder
    return c.json({ success: false, error: 'Not implemented' }, 501);
  };
};
