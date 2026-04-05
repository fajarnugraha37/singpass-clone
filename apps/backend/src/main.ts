import { getApp } from './index';
import { HttpsServer } from './infra/http/https.server';
import { HttpRedirectServer } from './infra/http/http.server';
import { Cron } from 'croner';
import { cleanupExpiredRecords } from './infra/database/cleanup';

/**
 * Production-ready entry point for Unified HTTPS Architecture.
 * Handles TLS lifecycle, key rotation, and background jobs.
 */

const { app, certService, keyManager } = await getApp();

if (!certService || !keyManager) {
  throw new Error('Failed to initialize critical services');
}

// Ensure active keys exist on startup and handle rotation if needed
const [tls, ] = await Promise.all([
  certService.ensureCertificates(),
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
