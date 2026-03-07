import { Hono } from 'hono'
import { cleanupExpiredRecords } from './infra/database/cleanup'
import { Cron } from 'croner'

const app = new Hono().basePath('/api')

// Periodic cleanup of expired FAPI records (every 10 minutes)
const cleanupJob = new Cron('*/10 * * * *', async () => {
  try {
    const stats = await cleanupExpiredRecords();
    if (stats.parCleaned > 0 || stats.authCodesCleaned > 0 || stats.sessionsCleaned > 0) {
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

const routes = app
  .get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

export type AppType = typeof routes
export default app
