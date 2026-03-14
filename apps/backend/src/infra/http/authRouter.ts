import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { 
  loginRequestSchema, 
  twoFactorRequestSchema,
  initiateAuthRequestSchema
} from '../../../../../packages/shared/src/contracts/auth';
import { InitiateAuthSessionUseCase } from '../../core/use-cases/InitiateAuthSession';
import { ValidateLoginUseCase } from '../../core/use-cases/ValidateLogin';
import { Validate2FAUseCase } from '../../core/use-cases/Validate2FA';
import { GetUserInfoUseCase } from '../../core/use-cases/get-userinfo';
import * as authController from './controllers/auth.controller';
import * as userinfoController from './controllers/userinfo.controller';

/**
 * Auth Router for both OIDC flow initiation and RPC API endpoints.
 */
export const createAuthRouter = (
  initiateAuthUseCase: InitiateAuthSessionUseCase,
  validateLoginUseCase: ValidateLoginUseCase,
  validate2FAUseCase: Validate2FAUseCase,
  getUserInfoUseCase: GetUserInfoUseCase,
  issuer: string
) => {
  const authRouter = new Hono()
    // OIDC Initiation Endpoint (mounted at /auth)
    .get(
      '/',
      zValidator('query', initiateAuthRequestSchema, (result, c) => {
        if (!result.success) {
          const frontendUrl = process.env.PUBLIC_FRONTEND_URL || 'http://localhost:4321';
          const errorUrl = new URL(`${frontendUrl}/error`);
          errorUrl.searchParams.set('error', 'invalid_request');
          errorUrl.searchParams.set('error_description', 'Missing or invalid client_id or request_uri');
          return c.redirect(errorUrl.toString());
        }
      }),
      authController.initiateAuth(initiateAuthUseCase)
    )

    // RPC API: Primary Login (mounted at /api/auth/login)
    .post('/login', zValidator('json', loginRequestSchema), authController.login(validateLoginUseCase))

    // RPC API: 2FA Verification (mounted at /api/auth/2fa)
    .post('/2fa', zValidator('json', twoFactorRequestSchema), authController.twoFactor(validate2FAUseCase))

    // OIDC UserInfo Endpoint (mounted at /userinfo or /auth/userinfo)
    .get('/userinfo', userinfoController.getUserInfo(getUserInfoUseCase, issuer))
    .post('/userinfo', userinfoController.getUserInfo(getUserInfoUseCase, issuer));

  return authRouter;
};
