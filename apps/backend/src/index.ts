import { serveStatic } from 'hono/bun';
import { Hono } from 'hono';
import { cleanupExpiredRecords } from './infra/database/cleanup';
import { Cron } from 'croner';
import { getDiscoveryDocument } from './infra/http/controllers/discovery.controller';
import { getJWKS } from './infra/http/controllers/jwks.controller';
import { registerPar } from './infra/http/controllers/par.controller';
import { exchangeToken } from './infra/http/controllers/token.controller';
import { JoseCryptoService } from './infra/adapters/jose_crypto';
import { DrizzleSecurityAuditService } from './infra/adapters/security_logger';
import { DrizzlePARRepository } from './infra/adapters/db/drizzle_par_repository';
import { DrizzleAuthSessionRepository } from './infra/adapters/db/drizzle_session_repository';
import { DrizzleAuthorizationCodeRepository } from './infra/adapters/db/drizzle_authorization_code_repository';
import { RegisterParUseCase } from './core/use-cases/register-par';
import { InitiateAuthSessionUseCase } from './core/use-cases/InitiateAuthSession';
import { ValidateLoginUseCase } from './core/use-cases/ValidateLogin';
import { Validate2FAUseCase } from './core/use-cases/Validate2FA';
import { GenerateAuthCodeUseCase } from './core/use-cases/GenerateAuthCode';
import { TokenExchangeUseCase } from './core/use-cases/token-exchange';
import { GetUserInfoUseCase } from './core/use-cases/get-userinfo';
import { ClientAuthenticationService } from './core/application/services/client-auth.service';
import { TokenService } from './core/application/services/token.service';
import { DrizzleTokenRepository } from './infra/adapters/db/drizzle_token_repository';
import { DrizzleUserInfoRepository } from './infra/adapters/db/drizzle_userinfo_repository';
import { DrizzleClientRegistry } from './infra/adapters/client_registry';
import { DrizzleJtiStore } from './infra/adapters/db/drizzle_jti_store';
import { DPoPValidator } from './core/utils/dpop_validator';
import { jwksCache } from './infra/adapters/jwks_cache';
import { createAuthRouter } from './infra/http/authRouter';
import { getUserInfo } from './infra/http/controllers/userinfo.controller';
import { fapiErrorHandler } from './infra/middleware/fapi-error';
import { sharedConfig } from '../../../packages/shared/src/config';
import { DrizzleServerKeyManager } from './infra/adapters/db/drizzle_key_manager';
import { swaggerUI } from '@hono/swagger-ui';
import { openapiSpec } from './infra/http/openapi-spec';

const auditService = new DrizzleSecurityAuditService();
const keyManager = new DrizzleServerKeyManager(auditService);
const cryptoService = new JoseCryptoService(keyManager, auditService);

// Ensure active keys exist on startup and handle rotation if needed
await Promise.all([
  keyManager.ensureActiveKey(),
  keyManager.rotateKeys()
]);
const parRepository = new DrizzlePARRepository();
const authSessionRepository = new DrizzleAuthSessionRepository();
const authCodeRepository = new DrizzleAuthorizationCodeRepository();
const tokenRepository = new DrizzleTokenRepository();
const userInfoRepository = new DrizzleUserInfoRepository();
const clientRegistry = new DrizzleClientRegistry();
const jtiStore = new DrizzleJtiStore();
const dpopValidator = new DPoPValidator(jtiStore);

const clientAuthService = new ClientAuthenticationService(cryptoService);
const tokenService = new TokenService(cryptoService);

const registerParUseCase = new RegisterParUseCase(cryptoService, parRepository, clientRegistry, auditService);
const tokenExchangeUseCase = new TokenExchangeUseCase(
  clientAuthService,
  tokenService,
  authCodeRepository,
  tokenRepository,
  dpopValidator,
  sharedConfig.OIDC.ISSUER
);
const getUserInfoUseCase = new GetUserInfoUseCase(
  userInfoRepository,
  cryptoService,
  dpopValidator,
  jwksCache,
  clientRegistry,
  auditService
);
const initiateAuthSessionUseCase = new InitiateAuthSessionUseCase(authSessionRepository, parRepository, auditService);
const validateLoginUseCase = new ValidateLoginUseCase(authSessionRepository, auditService);
const generateAuthCodeUseCase = new GenerateAuthCodeUseCase(authCodeRepository, authSessionRepository, parRepository, auditService);
const validate2FAUseCase = new Validate2FAUseCase(authSessionRepository, auditService, generateAuthCodeUseCase);

const authRouter = createAuthRouter(
  initiateAuthSessionUseCase,
  validateLoginUseCase,
  validate2FAUseCase,
  getUserInfoUseCase,
  sharedConfig.OIDC.ISSUER
);
const api = new Hono()
  .get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))
  .post('/par', registerPar(registerParUseCase))
  .post('/token', exchangeToken(tokenExchangeUseCase))
  .get('/userinfo', getUserInfo(getUserInfoUseCase, sharedConfig.OIDC.ISSUER))
  .post('/userinfo', getUserInfo(getUserInfoUseCase, sharedConfig.OIDC.ISSUER))
  // API: Auth RPC Endpoints (mounted at /api/auth)
  .route('/auth', authRouter);

const app = new Hono()
  .onError((err, c) => {
    if (err.name === 'FapiError') {
      const fapiErr = err as any;
      console.warn(`[FAPI Error] ${fapiErr.error}: ${fapiErr.description || 'No description'}`);
      return c.json({
        error: fapiErr.error,
        error_description: fapiErr.description,
      }, fapiErr.status || 400);
    }
    
    console.error('[Unhandled Error]', err);
    return c.json({
      error: 'server_error',
      error_description: 'An internal server error occurred',
    }, 500);
  })
  // API Routes
  .route('/api', api)
  // Auth Initiation (mounted at /auth)
  .route('/auth', authRouter)
  // Public OIDC Endpoints at Root
  .get('/.well-known/openid-configuration', getDiscoveryDocument)
  .get('/.well-known/keys', getJWKS(cryptoService))
  .post('/token', exchangeToken(tokenExchangeUseCase))
  .get('/userinfo', getUserInfo(getUserInfoUseCase, sharedConfig.OIDC.ISSUER))
  .post('/userinfo', getUserInfo(getUserInfoUseCase, sharedConfig.OIDC.ISSUER));

app
  .get('/doc', (c) => c.json(openapiSpec))
  // Swagger UI will be available at /ui
  .get('/ui', swaggerUI({ url: '/doc' }))
  // SPA Fallback
  .get('/', serveStatic({ path: 'static/index.html' }))
  // Serve static assets from the frontend build
  .use('/*', serveStatic({ 
    root: 'static',
  }));

// Periodic cleanup of expired FAPI records (every 10 minutes)
const cleanupJob = new Cron('*/10 * * * *', async () => {
  try {
    const stats = await cleanupExpiredRecords();
    if (stats.parCleaned > 0 || stats.authCodesCleaned > 0 || stats.sessionsCleaned > 0 || stats.jtisCleaned > 0 || stats.keysCleaned > 0) {
      console.info(`[Cleanup] Purged expired records:`, stats);
    }
  } catch (error) {
    console.error(`[Cleanup] Error during periodic cleanup:`, error);
  }
});

// Daily Key Rotation Job (every day at midnight)
const rotationJob = new Cron('0 0 * * *', async () => {
  try {
    await keyManager.rotateKeys();
  } catch (error) {
    console.error(`[Rotation] Error during periodic key rotation:`, error);
  }
});

// Graceful shutdown logic
const shutdown = () => {
  console.info('[Shutdown] Stopping cleanup and rotation jobs...');
  cleanupJob.stop();
  rotationJob.stop();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

export type AppType = typeof app;
export default app;