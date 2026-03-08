import { lt } from 'drizzle-orm';
import { db } from './client';
import { parRequests, authCodes, sessions, usedJtis } from './schema';

/**
 * Utility to clean up expired records from the database.
 * In a production environment, this would be triggered by a cron job or worker.
 */
export async function cleanupExpiredRecords(): Promise<{
  parCleaned: number;
  authCodesCleaned: number;
  sessionsCleaned: number;
  jtisCleaned: number;
}> {
  const now = new Date();

  // 1. Clean up expired PAR requests
  const parResult = await db.delete(parRequests)
    .where(lt(parRequests.expiresAt, now))
    .returning({ id: parRequests.id });

  // 2. Clean up expired Authorization Codes
  const authCodeResult = await db.delete(authCodes)
    .where(lt(authCodes.expiresAt, now))
    .returning({ id: authCodes.id });

  // 3. Clean up expired Sessions
  const sessionResult = await db.delete(sessions)
    .where(lt(sessions.expiresAt, now))
    .returning({ id: sessions.id });

  // 4. Clean up expired JTIs
  const jtiResult = await db.delete(usedJtis)
    .where(lt(usedJtis.expiresAt, now))
    .returning({ jti: usedJtis.jti });

  return {
    parCleaned: parResult.length,
    authCodesCleaned: authCodeResult.length,
    sessionsCleaned: sessionResult.length,
    jtisCleaned: jtiResult.length,
  };
}
