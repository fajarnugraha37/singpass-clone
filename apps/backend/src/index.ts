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
import { createAuthRouter } from './infra/http/authRouter'

const auditService = new DrizzleSecurityAuditService();
const cryptoService = new JoseCryptoService(auditService);
const parRepository = new DrizzlePARRepository();
const authSessionRepository = new DrizzleAuthSessionRepository();

const registerParUseCase = new RegisterParUseCase(cryptoService, parRepository, auditService);
const initiateAuthSessionUseCase = new InitiateAuthSessionUseCase(authSessionRepository, parRepository, auditService);

const app = new Hono()

// Public OIDC Endpoints at Root
app.get('/.well-known/openid-configuration', getDiscoveryDocument)
app.get('/.well-known/keys', getJWKS(cryptoService))

const authRouter = createAuthRouter(initiateAuthSessionUseCase);

// Auth Initiation (Redirects to Login UI)
app.route('/', authRouter)

// API Routes
const api = new Hono()
api.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))
api.post('/par', registerPar(registerParUseCase))

// API: Auth RPC Endpoints
api.route('/auth', authRouter)

app.route('/api', api)

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

export default app
