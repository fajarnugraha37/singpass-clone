import { Context } from 'hono';
import { setCookie, getCookie } from 'hono/cookie';
import { InitiateAuthSessionUseCase } from '../../../core/use-cases/InitiateAuthSession';
import { ValidateLoginUseCase } from '../../../core/use-cases/ValidateLogin';
import { Validate2FAUseCase } from '../../../core/use-cases/Validate2FA';
import type { AuthSessionRepository } from '../../../core/domain/session';
import type { PARRepository } from '../../../core/domain/par.types';

export const initiateAuth = (useCase: InitiateAuthSessionUseCase) => {
  return async (c: Context) => {
    try {
      const clientId = c.req.query('client_id') as string;
      const requestUri = c.req.query('request_uri') as string;

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
      
      const frontendUrl = process.env.PUBLIC_FRONTEND_URL || 'http://localhost:4321';
      const errorUrl = new URL(`${frontendUrl}/error`);
      errorUrl.searchParams.set('error', 'invalid_request');
      errorUrl.searchParams.set('error_description', error.message);
      
      return c.redirect(errorUrl.toString());
    }
  };
};

const handleTerminalFailure = async (c: Context, sessionId: string, sessionRepository: AuthSessionRepository, parRepository: PARRepository) => {
  const session = await sessionRepository.getById(sessionId);
  if (session) {
    const parRequest = await parRepository.getByRequestUri(session.parRequestUri);
    if (parRequest) {
      const { redirect_uri, state } = parRequest.payload as any;
      const redirectUrl = new URL(redirect_uri);
      redirectUrl.searchParams.set('error', 'login_required');
      if (state) {
        redirectUrl.searchParams.set('state', state);
      }
      return c.redirect(redirectUrl.toString());
    }
  }
  
  // Fallback if session/PAR not found
  return c.json({ success: false, error: 'Max retries exceeded' }, 401);
};

export const getSession = (sessionRepository: AuthSessionRepository) => {
  return async (c: Context) => {
    const sessionId = getCookie(c, 'vibe_auth_session');
    if (!sessionId) {
      return c.json({ error: 'Session not found' }, 401);
    }

    const session = await sessionRepository.getById(sessionId);
    if (!session) {
      return c.json({ error: 'Session not found' }, 401);
    }

    return c.json({
      clientId: session.clientId,
      purpose: session.purpose,
      status: session.status,
      expiresAt: session.expiresAt,
    });
  };
};

export const login = (useCase: ValidateLoginUseCase, sessionRepository: AuthSessionRepository, parRepository: PARRepository) => {
  return async (c: Context) => {
    try {
      const sessionId = getCookie(c, 'vibe_auth_session');
      if (!sessionId) {
        return c.json({ success: false, error: 'Session not found' }, 401);
      }

      const { username, password } = await c.req.json();
      const result = await useCase.execute({ sessionId, username, password });

      if (!result.success) {
        if (result.status === 'FAILED') {
          return await handleTerminalFailure(c, sessionId, sessionRepository, parRepository);
        }
        return c.json(result, 401);
      }

      return c.json(result, 200);
    } catch (error: any) {
      console.error('[Login] Error:', error);
      return c.json({ success: false, error: 'Internal server error' }, 500);
    }
  };
};

export const twoFactor = (useCase: Validate2FAUseCase, sessionRepository: AuthSessionRepository, parRepository: PARRepository) => {
  return async (c: Context) => {
    try {
      const sessionId = getCookie(c, 'vibe_auth_session');
      if (!sessionId) {
        return c.json({ success: false, error: 'Session not found' }, 401);
      }

      const { otp } = await c.req.json();
      const result = await useCase.execute({ sessionId, otp });

      if (!result.success) {
        if (result.status === 'FAILED') {
          return await handleTerminalFailure(c, sessionId, sessionRepository, parRepository);
        }
        return c.json(result, 401);
      }

      return c.json(result, 200);
    } catch (error: any) {
      console.error('[2FA] Error:', error);
      return c.json({ success: false, error: 'Internal server error' }, 500);
    }
  };
};
