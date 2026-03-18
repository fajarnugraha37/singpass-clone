import { cors } from 'hono/cors';
import { serveStatic } from 'hono/bun';
import { Hono } from 'hono';
import { cleanupExpiredRecords } from './infra/database/cleanup';
import { Cron } from 'croner';
import { getDiscoveryDocument } from './infra/http/controllers/discovery.controller';
import { getJWKS } from './infra/http/controllers/jwks.controller';
import { registerPar } from './infra/http/controllers/par.controller';
import { getClient } from './infra/http/controllers/client.controller';
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
import { jwksCache } from './infra/adapters/jwks_cache';
import { createAuthRouter } from './infra/http/authRouter';
import { ValidateUserInfoRequestUseCase } from './application/usecases/validate-userinfo-request';
import { GenerateUserInfoPayloadUseCase } from './application/usecases/generate-userinfo-payload';
import { createUserinfoRouter } from './infra/http/routes/userinfo-routes';
import { sharedConfig } from '../../../packages/shared/src/config';
import { DrizzleServerKeyManager } from './infra/adapters/db/drizzle_key_manager';
import { swaggerUI } from '@hono/swagger-ui';
import { openapiSpec } from './infra/http/openapi-spec';
import { fapiHeaders } from './infra/middleware/fapi-headers';
import { CertificateService } from './infra/http/certificate.service';
import { HttpsServer } from './infra/http/https.server';
import { HttpRedirectServer } from './infra/http/http.server';
import { DPoPValidator } from './core/utils/dpop_validator';

const certService = new CertificateService();
// We still need certificates for the Hono app fetch if we use it, 
// but we only really need them for HttpsServer. 
// However, await is fine here as it's just generating files.
const tls = await certService.ensureCertificates();

const auditService = new DrizzleSecurityAuditService();
const keyManager = new DrizzleServerKeyManager(auditService);
const clientRegistry = new DrizzleClientRegistry();
const cryptoService = new JoseCryptoService(keyManager, clientRegistry, auditService);

const parRepository = new DrizzlePARRepository();
const authSessionRepository = new DrizzleAuthSessionRepository();
const authCodeRepository = new DrizzleAuthorizationCodeRepository();
const tokenRepository = new DrizzleTokenRepository();
const userInfoRepository = new DrizzleUserInfoRepository();
const jtiStore = new DrizzleJtiStore();
const dpopValidatorInstance = new DPoPValidator(jtiStore);

const clientAuthService = new ClientAuthenticationService(cryptoService, clientRegistry, jwksCache, jtiStore);
const tokenService = new TokenService(cryptoService, clientRegistry, jwksCache);

const registerParUseCase = new RegisterParUseCase(cryptoService, parRepository, clientRegistry, dpopValidatorInstance, jwksCache, auditService);
const tokenExchangeUseCase = new TokenExchangeUseCase(
  clientAuthService,
  tokenService,
  authCodeRepository,
  tokenRepository,
  dpopValidatorInstance,
  userInfoRepository,
  cryptoService,
  sharedConfig.OIDC.ISSUER
);
const getUserInfoUseCase = new GetUserInfoUseCase(
  userInfoRepository,
  cryptoService,
  dpopValidatorInstance,
  jwksCache,
  clientRegistry,
  auditService
);
const validateUserInfoRequestUseCase = new ValidateUserInfoRequestUseCase(userInfoRepository, dpopValidatorInstance, cryptoService);
const generateUserInfoPayloadUseCase = new GenerateUserInfoPayloadUseCase(cryptoService);

const userinfoRouter = createUserinfoRouter(
  validateUserInfoRequestUseCase,
  generateUserInfoPayloadUseCase,
  userInfoRepository,
  clientRegistry,
  jwksCache,
  auditService,
  sharedConfig.OIDC.ISSUER
);

const initiateAuthSessionUseCase = new InitiateAuthSessionUseCase(authSessionRepository, parRepository, auditService, clientRegistry);
const validateLoginUseCase = new ValidateLoginUseCase(authSessionRepository, auditService, userInfoRepository);
const generateAuthCodeUseCase = new GenerateAuthCodeUseCase(authCodeRepository, authSessionRepository, parRepository, auditService);
const validate2FAUseCase = new Validate2FAUseCase(authSessionRepository, auditService, generateAuthCodeUseCase);

const authRouter = createAuthRouter(
  initiateAuthSessionUseCase,
  validateLoginUseCase,
  validate2FAUseCase,
  getUserInfoUseCase,
  authSessionRepository,
  parRepository,
  clientRegistry,
  sharedConfig.OIDC.ISSUER
);

const api = new Hono()
  .use('*', fapiHeaders)
  .get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))
  .post('/par', registerPar(registerParUseCase))
  .post('/token', exchangeToken(tokenExchangeUseCase))
  .get('/clients/:clientId', getClient(clientRegistry))
  .route('/userinfo', userinfoRouter)
  // API: Auth RPC Endpoints (mounted at /api/auth)
  .route('/auth', authRouter);

const app = new Hono()
  .use('*', async (c, next) => {
    // Security Hardening
    c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    c.header('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://localhost;");
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('X-Frame-Options', 'DENY');
    c.header('X-XSS-Protection', '1; mode=block');
    await next();
  })
  .use('*', cors({
    origin: (origin) => {
      // Allow local development and unified HTTPS origin
      if (origin === 'https://localhost' || origin?.startsWith('https://localhost:')) return origin;
      if (origin?.startsWith('http://localhost:')) return origin;
      return 'https://localhost';
    },
    credentials: true,
  }))
  .onError((err, c) => {
    if (err.name === 'FapiError') {
      const fapiErr = err as any;
      console.warn(`[FAPI Error] ${fapiErr.error}: ${fapiErr.description || 'No description'}`);
      
      if (fapiErr.headers) {
        Object.entries(fapiErr.headers).forEach(([key, value]) => {
          c.header(key, value as string);
        });
      }

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
  // UserInfo (aligned with Myinfo v5)
  .route('/userinfo', userinfoRouter)
  // Public OIDC Endpoints at Root
  .use('/.well-known/*', fapiHeaders)
  .get('/.well-known/openid-configuration', getDiscoveryDocument)
  .get('/.well-known/keys', getJWKS(cryptoService))
  .use('/token', fapiHeaders)
  .post('/token', exchangeToken(tokenExchangeUseCase));

app
  .get('/doc', (c) => c.json(openapiSpec))
  // Swagger UI will be available at /ui
  .get('/ui', swaggerUI({ url: '/doc' }))
  // Serve static assets from the frontend build
  .use('/*', serveStatic({ 
    root: '../frontend/dist',
  }))
  // SPA Fallback
  .get('*', serveStatic({ path: '../frontend/dist/index.html' }));

// Start Servers and Jobs only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  // Ensure active keys exist on startup and handle rotation if needed
  await Promise.all([
    keyManager.ensureActiveKey(),
    keyManager.rotateKeys()
  ]);

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

  // Start Servers
  const portHttps = parseInt(process.env.PORT_HTTPS || '443');
  const portHttp = parseInt(process.env.PORT_HTTP || '80');

  const httpsServer = new HttpsServer({
    port: portHttps,
    fetch: app.fetch,
    tls,
  });
  httpsServer.start();

  const httpServer = new HttpRedirectServer({
    port: portHttp,
  });
  httpServer.start();
}

export type AppType = typeof app;
export default app;
