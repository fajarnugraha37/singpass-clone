import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { 
  loginRequestSchema, 
  twoFactorRequestSchema 
} from '../../../../packages/shared/src/contracts/auth';
import { InitiateAuthSessionUseCase } from '../../core/use-cases/InitiateAuthSession';
import * as authController from './controllers/auth.controller';

/**
 * Auth Router for both OIDC flow initiation and RPC API endpoints.
 */
export const createAuthRouter = (initiateAuthUseCase: InitiateAuthSessionUseCase) => {
  const authRouter = new Hono()

  // OIDC Initiation Endpoint
  authRouter.get('/auth', authController.initiateAuth(initiateAuthUseCase));

  // RPC API: Primary Login
  authRouter.post('/api/login', zValidator('json', loginRequestSchema), authController.login());

  // RPC API: 2FA Verification
  authRouter.post('/api/2fa', zValidator('json', twoFactorRequestSchema), authController.twoFactor());

  return authRouter;
};
