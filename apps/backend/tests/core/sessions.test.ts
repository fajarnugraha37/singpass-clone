import { describe, it, expect, beforeEach } from 'bun:test';
import { SessionService } from '../../src/core/sessions/service';
import { getDb } from '../../src/infra/database/client';
import { sessions, clients } from '../../src/infra/database/schema';
import { eq } from 'drizzle-orm';

describe('SessionService', () => {
  let sessionService: SessionService;
  let db: any;

  beforeEach(async () => {
    db = await getDb();
    await db.delete(sessions);
    await db.delete(clients);
    
    // Seed a client
    await db.insert(clients).values({
      id: 'client-1',
      name: 'Test Client',
      appType: 'Login',
      uen: 'UEN123',
      redirectUris: [],
      allowedScopes: [],
      grantTypes: [],
    });

    sessionService = new SessionService(db);
  });

  it('should revoke a specific session', async () => {
    await db.insert(sessions).values({
      id: 'session-1',
      clientId: 'client-1',
      expiresAt: new Date(Date.now() + 3600000),
    });

    await sessionService.revokeSession('session-1');
    
    const results = await db.select().from(sessions).where(eq(sessions.id, 'session-1'));
    expect(results.length).toBe(0);
  });

  it('should revoke all sessions for a client', async () => {
    await db.insert(sessions).values([
      { id: 's1', clientId: 'client-1', expiresAt: new Date() },
      { id: 's2', clientId: 'client-1', expiresAt: new Date() },
    ]);

    await sessionService.revokeAllClientSessions('client-1');
    
    const results = await db.select().from(sessions).where(eq(sessions.clientId, 'client-1'));
    expect(results.length).toBe(0);
  });
});
