import type { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import { verifySingpassJWT } from '../../core/security/jwt_utils';

export const rbac = (requiredRole: 'developer' | 'admin') => {
  return async (c: Context, next: Next) => {
    const token = getCookie(c, 'vibe_mgmt_session') || c.req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return c.json({ error: 'Unauthorized', message: 'No session token found' }, 401);
    }

    try {
      const payload = await verifySingpassJWT(token);
      const userRole = payload.role as string;

      if (!userRole) {
        return c.json({ error: 'Forbidden', message: 'No role assigned to session' }, 403);
      }

      // Admin has access to everything
      if (userRole === 'admin') {
        c.set('user', payload);
        return await next();
      }

      // If required role is developer, allow developer role
      if (requiredRole === 'developer' && userRole === 'developer') {
        c.set('user', payload);
        return await next();
      }

      return c.json({ error: 'Forbidden', message: `Required role: ${requiredRole}` }, 403);
    } catch (error) {
      console.error('[RBAC Middleware] Token verification failed:', error);
      return c.json({ error: 'Unauthorized', message: 'Invalid or expired session token' }, 401);
    }
  };
};
