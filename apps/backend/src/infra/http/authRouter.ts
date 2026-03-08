import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { 
  loginRequestSchema, 
  twoFactorRequestSchema 
} from '../../../../packages/shared/src/contracts/auth';

/**
 * Auth Router for both OIDC flow initiation and RPC API endpoints.
 */
const authRouter = new Hono()

// OIDC Initiation Endpoint
authRouter.get('/auth', async (c) => {
  const clientId = c.req.query('client_id');
  const requestUri = c.req.query('request_uri');

  if (!clientId || !requestUri) {
    return c.text('Missing client_id or request_uri', 400);
  }

  // TODO: Implement Session Initiation Use Case (T011)
  return c.text('Auth session initiation placeholder');
});

// RPC API: Primary Login
authRouter.post('/api/login', zValidator('json', loginRequestSchema), async (c) => {
  // TODO: Implement Login Use Case (T018)
  return c.json({ success: false, error: 'Not implemented' }, 501);
});

// RPC API: 2FA Verification
authRouter.post('/api/2fa', zValidator('json', twoFactorRequestSchema), async (c) => {
  // TODO: Implement 2FA Use Case (T019)
  return c.json({ success: false, error: 'Not implemented' }, 501);
});

export { authRouter };
