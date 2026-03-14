import { lt, and, eq } from 'drizzle-orm';
import { db } from './client';
import { parRequests, authCodes, sessions, usedJtis, serverKeys } from './schema';

/**
 * Utility to clean up expired records from the database.
 */
export async function cleanupExpiredRecords(): Promise<{
  parCleaned: number;
  authCodesCleaned: number;
  sessionsCleaned: number;
  jtisCleaned: number;
  keysCleaned: number;
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

  // 5. Clean up old inactive server keys (e.g., older than 30 days)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const keysResult = await db.delete(serverKeys)
    .where(and(
      eq(serverKeys.isActive, false),
      lt(serverKeys.createdAt, thirtyDaysAgo)
    ))
    .returning({ id: serverKeys.id });

  return {
    parCleaned: parResult.length,
    authCodesCleaned: authCodeResult.length,
    sessionsCleaned: sessionResult.length,
    jtisCleaned: jtiResult.length,
    keysCleaned: keysResult.length,
  };
}
