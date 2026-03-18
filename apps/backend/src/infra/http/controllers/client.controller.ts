import { Context } from 'hono';
import { ClientRegistry } from '../../../core/domain/client_registry';

export const getClient = (clientRegistry: ClientRegistry) => {
  return async (c: Context) => {
    const clientId = c.req.param('clientId');
    if (!clientId) {
      return c.json({ error: 'clientId is required' }, 400);
    }

    const client = await clientRegistry.getClientConfig(clientId);
    if (!client) {
      return c.json({ error: 'Client not found' }, 404);
    }

    // Return full configuration including administrative fields (FR-005, FR-006)
    return c.json({
      clientId: client.clientId,
      clientName: client.clientName,
      appType: client.appType,
      uen: client.uen,
      isActive: client.isActive,
      allowedScopes: client.allowedScopes,
      redirectUris: client.redirectUris,
      jwksUri: client.jwksUri,
      siteUrl: client.siteUrl,
      appDescription: client.appDescription,
      supportEmails: client.supportEmails,
      environment: client.environment,
      hasAcceptedAgreement: client.hasAcceptedAgreement,
    });
  };
};
