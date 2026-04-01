import { Context } from 'hono';
import { getCookie } from 'hono/cookie';
import { QRAuthService } from '../../../core/services/qr_auth_service';

export const initQR = (service: QRAuthService) => {
  return async (c: Context) => {
    try {
      const sessionId = getCookie(c, 'vibe_auth_session');
      if (!sessionId) {
        return c.json({ error: 'Session not found' }, 401);
      }

      // We need to get the clientId from the existing vibe_auth_session.
      // For now, assume service can resolve it or we pass it if we have it.
      // Let's modify the service to take the sessionId and resolve clientId internally or pass it.
      // Better: The controller resolves the clientId from the session repository.
      // But since we want to share resources, let's just pass the sessionId to the service.
      
      const result = await service.initQRSession(sessionId);
      return c.json(result, 201);
    } catch (error: any) {
      console.error('[QR Init] Error:', error);
      return c.json({ error: 'failed_to_init_qr', message: error.message }, 500);
    }
  };
};

export const getQRStatus = (service: QRAuthService) => {
  return async (c: Context) => {
    const sessionId = c.req.param('sessionId');
    const startTime = Date.now();
    const timeout = 25000; // 25 seconds (slightly less than typical 30s proxy timeout)

    try {
      while (Date.now() - startTime < timeout) {
        const result = await service.getSessionStatus(sessionId);
        
        // If status changed from PENDING, return immediately
        if (result.status !== 'PENDING') {
          return c.json(result);
        }

        // Wait before next check
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // If we reached timeout, return PENDING to let client poll again
      return c.json({ status: 'PENDING' });
    } catch (error: any) {
      console.error('[QR Status] Error:', error);
      return c.json({ error: 'failed_to_get_status' }, 500);
    }
  };
};

export const singpassCallback = (service: QRAuthService) => {
  return async (c: Context) => {
    const state = c.req.query('state');
    const code = c.req.query('code');
    const error = c.req.query('error');

    if (!state) {
      return c.text('Invalid request: missing state', 400);
    }

    try {
      await service.handleCallback(state, code, error);
      // For QR flow, the user usually authorizes on mobile. 
      // The desktop is polling. The callback endpoint can just show a success message or close.
      return c.html(`
        <html>
          <body style="font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f4f4f9;">
            <div style="text-align: center; background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h1 style="color: #2d3748;">Authorization Complete</h1>
              <p style="color: #4a5568;">You have successfully authorized the login. You can now return to your desktop browser.</p>
              <p style="color: #718096; font-size: 0.875rem;">This window will close automatically in 3 seconds.</p>
              <script>setTimeout(() => window.close(), 3000);</script>
            </div>
          </body>
        </html>
      `);
    } catch (err: any) {
      console.error('[Singpass Callback] Error:', err);
      return c.text('Authorization failed: ' + err.message, 500);
    }
  };
};
