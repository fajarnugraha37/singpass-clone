import { eq, inArray, and, desc, lt, or } from 'drizzle-orm';
import { sessions, clients } from '../../infra/database/schema';

export class SessionService {
  constructor(private db: any) {}

  async revokeSession(sessionId: string, developerId?: string): Promise<void> {
    if (developerId) {
      // Find session and verify client ownership
      const session = await this.db.query.sessions.findFirst({
        where: eq(sessions.id, sessionId),
        with: {
          client: true // Requires relation definition, or we can just join
        }
      });
      // Actually, drizzle-orm query without relations requires join or subquery.
      // Let's just do a manual check.
      const s = await this.db.select().from(sessions).where(eq(sessions.id, sessionId));
      if (!s.length) return;
      
      const c = await this.db.select().from(clients).where(and(eq(clients.id, s[0].clientId), eq(clients.developerId, developerId)));
      if (!c.length) throw new Error('Unauthorized');
    }

    await this.db.delete(sessions).where(eq(sessions.id, sessionId));
  }

  async revokeAllClientSessions(clientId: string): Promise<void> {
    await this.db.delete(sessions).where(eq(sessions.clientId, clientId));
  }

  async listDeveloperSessions(developerId: string, pagination: { cursor?: string; limit: number }): Promise<any> {
    const { cursor, limit } = pagination;
    
    // Get developer's clients
    const myClients = await this.db.select({ id: clients.id }).from(clients).where(eq(clients.developerId, developerId));
    if (!myClients.length) return { items: [], nextCursor: null };
    
    const clientIds = myClients.map((c: any) => c.id);

    let whereClause = inArray(sessions.clientId, clientIds);
    if (cursor) {
      const [createdAt, id] = JSON.parse(Buffer.from(cursor, 'base64').toString());
      const cursorClause = or(
        lt(sessions.createdAt, new Date(createdAt)),
        and(eq(sessions.createdAt, new Date(createdAt)), lt(sessions.id, id))
      );
      whereClause = and(whereClause, cursorClause)!;
    }

    const items = await this.db.query.sessions.findMany({
      where: whereClause,
      limit: limit + 1,
      orderBy: [desc(sessions.createdAt), desc(sessions.id)],
    });

    let nextCursor = null;
    if (items.length > limit) {
      items.pop();
      const lastItem = items[items.length - 1];
      nextCursor = Buffer.from(JSON.stringify([lastItem.createdAt.toISOString(), lastItem.id])).toString('base64');
    }

    return { items, nextCursor };
  }
}
