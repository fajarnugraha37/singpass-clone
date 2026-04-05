import { eq } from 'drizzle-orm';
import { sessions } from '../../infra/database/schema';

export class SessionService {
  constructor(private db: any) {}

  async revokeSession(sessionId: string): Promise<void> {
    await this.db.delete(sessions).where(eq(sessions.id, sessionId));
  }

  async revokeAllClientSessions(clientId: string): Promise<void> {
    await this.db.delete(sessions).where(eq(sessions.clientId, clientId));
  }
}
