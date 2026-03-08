import { Hono } from 'hono'
import { cleanupExpiredRecords } from './infra/database/cleanup'
import { Cron } from 'croner'
import { getDiscoveryDocument } from './infra/http/controllers/discovery.controller'
import { getJWKS } from './infra/http/controllers/jwks.controller'
import { registerPar } from './infra/http/controllers/par.controller'
import { JoseCryptoService } from './infra/adapters/jose_crypto'
import { DrizzleSecurityAuditService } from './infra/adapters/security_logger'
import { DrizzlePARRepository } from './infra/adapters/db/drizzle_par_repository'
import { DrizzleAuthSessionRepository } from './infra/adapters/db/drizzle_session_repository'
import { RegisterParUseCase } from './core/use-cases/register-par'
import { InitiateAuthSessionUseCase } from './core/use-cases/InitiateAuthSession'
import { ValidateLoginUseCase } from './core/use-cases/ValidateLogin'
import { Validate2FAUseCase } from './core/use-cases/Validate2FA'
import { createAuthRouter } from './infra/http/authRouter'

const auditService = new DrizzleSecurityAuditService();
const cryptoService = new JoseCryptoService(auditService);
const parRepository = new DrizzlePARRepository();
const authSessionRepository = new DrizzleAuthSessionRepository();

const registerParUseCase = new RegisterParUseCase(cryptoService, parRepository, auditService);
const initiateAuthSessionUseCase = new InitiateAuthSessionUseCase(authSessionRepository, parRepository, auditService);
const validateLoginUseCase = new ValidateLoginUseCase(authSessionRepository, auditService);
const validate2FAUseCase = new Validate2FAUseCase(authSessionRepository, auditService);
const authRouter = createAuthRouter(
  initiateAuthSessionUseCase,
  validateLoginUseCase,
  validate2FAUseCase
);
const apiRouter = new Hono()
  .get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))
  .post('/par', registerPar(registerParUseCase));

const app = new Hono()

  // Public OIDC Endpoints at Root
  .get('/.well-known/openid-configuration', getDiscoveryDocument)
  .get('/.well-known/keys', getJWKS(cryptoService))

  // Auth Initiation (Redirects to Login UI)
  .route('/', authRouter)
  // API: Auth RPC Endpoints
  .route('/auth', authRouter)
  .route('/api', apiRouter);

// Periodic cleanup of expired FAPI records (every 10 minutes)
const cleanupJob = new Cron('*/10 * * * *', async () => {
  try {
    const stats = await cleanupExpiredRecords();
    if (stats.parCleaned > 0 || stats.authCodesCleaned > 0 || stats.sessionsCleaned > 0 || stats.jtisCleaned > 0) {
      console.info(`[Cleanup] Purged expired records:`, stats);
    }
  } catch (error) {
    console.error(`[Cleanup] Error during periodic cleanup:`, error);
  }
});

// Graceful shutdown logic
const shutdown = () => {
  console.info('[Shutdown] Stopping cleanup job...');
  cleanupJob.stop();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

export type AppType = typeof app;
export default app
