import { describe, it, expect, beforeEach } from 'bun:test';
import { ClientService } from '../../src/core/clients/service';
import { getDb } from '../../src/infra/database/client';
import { developers, clients, sessions } from '../../src/infra/database/schema';
import { eq } from 'drizzle-orm';

describe('ClientService', () => {
  let clientService: ClientService;
  let db: any;
  let devId: string;

  beforeEach(async () => {
    db = await getDb();
    // Clean up
    await db.delete(sessions);
    await db.delete(clients);
    await db.delete(developers);
    
    // Seed a developer
    const [dev] = await db.insert(developers).values({
      email: 'dev@example.com',
      role: 'developer',
      status: 'active',
    }).returning();
    devId = dev.id;

    clientService = new ClientService(db);
  });

  it('should allow a developer to create a client', async () => {
    const data = {
      name: 'Test App',
      appType: 'Login',
      uen: 'UEN123',
      redirectUris: ['http://localhost:3000/callback'],
      allowedScopes: ['openid', 'profile'],
      grantTypes: ['authorization_code'],
    };

    const client = await clientService.createClient(devId, data);
    expect(client.id).toBeDefined();
    expect(client.developerId).toBe(devId);
    expect(client.name).toBe('Test App');
  });

  it('should allow a developer to rotate client secret', async () => {
    const client = await clientService.createClient(devId, {
      name: 'Test App',
      appType: 'Login',
      uen: 'UEN123',
      redirectUris: ['http://localhost:3000/callback'],
      allowedScopes: ['openid'],
      grantTypes: ['authorization_code'],
    });

    const oldSecret = client.clientSecret;
    const newSecret = await clientService.rotateSecret(devId, client.id);
    
    expect(newSecret).not.toBe(oldSecret);
    
    const [updatedClient] = await db.select().from(clients).where(eq(clients.id, client.id));
    expect(updatedClient.clientSecret).toBeDefined();
    // In our implementation, we store hashed secret, so we can't directly compare newSecret with updatedClient.clientSecret
  });

  it('should revoke all sessions when a client is soft-deleted', async () => {
    const client = await clientService.createClient(devId, {
      name: 'Test App',
      appType: 'Login',
      uen: 'UEN123',
      redirectUris: ['http://localhost:3000/callback'],
      allowedScopes: ['openid'],
      grantTypes: ['authorization_code'],
    });

    // Create a mock session
    await db.insert(sessions).values({
      id: 'session-1',
      clientId: client.id,
      expiresAt: new Date(Date.now() + 3600000),
    });

    await clientService.deleteClient(devId, client.id);

    const [deletedClient] = await db.select().from(clients).where(eq(clients.id, client.id));
    expect(deletedClient.deletedAt).not.toBeNull();

    const activeSessions = await db.select().from(sessions).where(eq(sessions.clientId, client.id));
    expect(activeSessions.length).toBe(0);
  });
});
