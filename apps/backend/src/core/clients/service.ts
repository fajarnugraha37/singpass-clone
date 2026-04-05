import { eq, and, isNull } from 'drizzle-orm';
import { clients, sessions } from '../../infra/database/schema';
import * as crypto from 'node:crypto';

export class ClientService {
  constructor(private db: any) {}

  async createClient(developerId: string, data: any): Promise<any> {
    const clientId = crypto.randomBytes(12).toString('hex');
    const clientSecret = crypto.randomBytes(32).toString('hex');
    const hashedSecret = await Bun.password.hash(clientSecret);

    const [client] = await this.db.insert(clients).values({
      id: clientId,
      developerId,
      clientSecret: hashedSecret,
      name: data.name,
      appType: data.appType,
      uen: data.uen,
      redirectUris: data.redirectUris,
      allowedScopes: data.allowedScopes,
      grantTypes: data.grantTypes,
      isActive: true,
    }).returning();

    return { ...client, clientSecret }; // Return plain secret only once upon creation
  }

  async updateClient(developerId: string, clientId: string, data: any): Promise<any> {
    const [client] = await this.db.update(clients)
      .set({
        name: data.name,
        appType: data.appType,
        uen: data.uen,
        redirectUris: data.redirectUris,
        allowedScopes: data.allowedScopes,
        grantTypes: data.grantTypes,
        updatedAt: new Date()
      })
      .where(and(eq(clients.id, clientId), eq(clients.developerId, developerId), isNull(clients.deletedAt)))
      .returning();

    if (!client) throw new Error('Client not found or unauthorized');
    return client;
  }

  async toggleClientStatus(developerId: string, clientId: string, isActive: boolean): Promise<any> {
    const [client] = await this.db.update(clients)
      .set({ isActive, updatedAt: new Date() })
      .where(and(eq(clients.id, clientId), eq(clients.developerId, developerId), isNull(clients.deletedAt)))
      .returning();

    if (!client) throw new Error('Client not found or unauthorized');

    // Revoke all active sessions if deactivated
    if (!isActive) {
      await this.db.delete(sessions).where(eq(sessions.clientId, clientId));
    }

    return client;
  }

  async rotateSecret(developerId: string, clientId: string): Promise<string> {
    const newSecret = crypto.randomBytes(32).toString('hex');
    const hashedSecret = await Bun.password.hash(newSecret);

    const [client] = await this.db.update(clients)
      .set({ clientSecret: hashedSecret, updatedAt: new Date() })
      .where(and(eq(clients.id, clientId), eq(clients.developerId, developerId)))
      .returning();

    if (!client) throw new Error('Client not found or unauthorized');

    return newSecret;
  }

  async deleteClient(developerId: string, clientId: string): Promise<void> {
    // 1. Soft delete client
    const [client] = await this.db.update(clients)
      .set({ deletedAt: new Date(), isActive: false, updatedAt: new Date() })
      .where(and(eq(clients.id, clientId), eq(clients.developerId, developerId)))
      .returning();

    if (!client) throw new Error('Client not found or unauthorized');

    // 2. Revoke all active sessions
    await this.db.delete(sessions).where(eq(sessions.clientId, clientId));
  }

  async getDeveloperClients(developerId: string): Promise<any[]> {
    return await this.db.query.clients.findMany({
      where: and(eq(clients.developerId, developerId), isNull(clients.deletedAt)),
    });
  }
}
