import { eq, desc, and, lt, or } from 'drizzle-orm';
import { developers, clients, sessions, users } from '../../infra/database/schema';

export interface CursorPagination {
  cursor?: string;
  limit: number;
}

export class AdminService {
  constructor(private db: any) {}

  async listDevelopers(pagination: CursorPagination): Promise<any> {
    const { cursor, limit } = pagination;
    
    let whereClause = undefined;
    if (cursor) {
      const [createdAt, id] = JSON.parse(Buffer.from(cursor, 'base64').toString());
      whereClause = or(
        lt(developers.createdAt, new Date(createdAt)),
        and(eq(developers.createdAt, new Date(createdAt)), lt(developers.id, id))
      );
    }

    const items = await this.db.query.developers.findMany({
      where: whereClause,
      limit: limit + 1,
      orderBy: [desc(developers.createdAt), desc(developers.id)],
    });

    let nextCursor = null;
    if (items.length > limit) {
      items.pop(); // Remove the extra item used to detect next page
      const lastItem = items[items.length - 1];
      nextCursor = Buffer.from(JSON.stringify([lastItem.createdAt.toISOString(), lastItem.id])).toString('base64');
    }

    return { items, nextCursor };
  }

  async listClients(pagination: CursorPagination): Promise<any> {
    const { cursor, limit } = pagination;
    
    let whereClause = undefined;
    if (cursor) {
      const [createdAt, id] = JSON.parse(Buffer.from(cursor, 'base64').toString());
      whereClause = or(
        lt(clients.createdAt, new Date(createdAt)),
        and(eq(clients.createdAt, new Date(createdAt)), lt(clients.id, id))
      );
    }

    const items = await this.db.query.clients.findMany({
      where: whereClause,
      limit: limit + 1,
      orderBy: [desc(clients.createdAt), desc(clients.id)],
    });

    let nextCursor = null;
    if (items.length > limit) {
      items.pop();
      const lastItem = items[items.length - 1];
      nextCursor = Buffer.from(JSON.stringify([lastItem.createdAt.toISOString(), lastItem.id])).toString('base64');
    }

    return { items, nextCursor };
  }

  async listSessions(pagination: CursorPagination): Promise<any> {
    const { cursor, limit } = pagination;
    
    let whereClause = undefined;
    if (cursor) {
      const [createdAt, id] = JSON.parse(Buffer.from(cursor, 'base64').toString());
      whereClause = or(
        lt(sessions.createdAt, new Date(createdAt)),
        and(eq(sessions.createdAt, new Date(createdAt)), lt(sessions.id, id))
      );
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
