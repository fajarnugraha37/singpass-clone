import type { ClientRegistry, ClientConfig } from '../../core/domain/client_registry';
import { db } from '../database/client';
import { clients } from '../database/schema';
import { eq } from 'drizzle-orm';

/**
 * Hardened Client Registry.
 * In a full production system, this would query a database table 'clients'.
 * For this implementation, it uses a configured list of allowed clients.
 */
export const HARDENED_CLIENT_REGISTRY: Record<string, ClientConfig> = {
  'mock-client-id': {
    clientId: 'mock-client-id',
    clientName: 'Hardened Client Application',
    appType: 'Login',
    redirectUris: ['http://localhost:3000/callback'],
    allowedScopes: ['openid', 'uinfin', 'name', 'email'],
    isActive: true,
    uen: '202412345G',
    siteUrl: 'https://mock-app.vibe-auth.com',
    appDescription: 'A secure mock application for testing Singpass flows.',
    supportEmails: ['support@mock-app.vibe-auth.com'],
    environment: 'Staging',
    hasAcceptedAgreement: true,
    jwks: {
      keys: [
        {
          kty: 'EC',
          crv: 'P-256',
          x: 'f83OJ3D2xF1Bg8vub9tLe1gHMzV76e8Tus9uPHvRVEU',
          y: 'x_FEzRu9m36HLN_tue659LNpXW6pCyStikYjKIWI5a0',
          kid: 'mock-client-key-1',
          use: 'sig',
          alg: 'ES256',
        },
        {
          kty: 'EC',
          crv: 'P-256',
          x: '1HrSJLEHsUI8f3TCMdiFVtDyXOtmJeu0x2b0MT-a1vI',
          y: 'cRC2KiCF4oQxfiZ39vVBMp5ng2rPEpYSSmNI7brbTiQ',
          kid: 'mock-client-enc-key',
          use: 'enc',
          alg: 'ECDH-ES+A256KW',
        },
      ],
    },
  },
  'test-client': {
    clientId: 'test-client',
    clientName: 'Production Test Client',
    appType: 'Myinfo',
    redirectUris: ['http://localhost:3000/cb'],
    allowedScopes: ['openid', 'uinfin'],
    isActive: true,
    uen: '199001234M',
    environment: 'Production',
    hasAcceptedAgreement: true,
    jwks: {
      keys: [
        {
          kty: 'EC',
          crv: 'P-256',
          x: 'f83OJ3D2xF1Bg8vub9tLe1gHMzV76e8Tus9uPHvRVEU',
          y: 'x_FEzRu9m36HLN_tue659LNpXW6pCyStikYjKIWI5a0',
          kid: 'test-client-key',
          use: 'sig',
          alg: 'ES256',
        },
        {
          kty: 'EC',
          crv: 'P-256',
          x: 'f83OJ3D2xF1Bg8vub9tLe1gHMzV76e8Tus9uPHvRVEU',
          y: 'x_FEzRu9m36HLN_tue659LNpXW6pCyStikYjKIWI5a0',
          kid: 'test-client-enc-key',
          use: 'enc',
          alg: 'ECDH-ES+A256KW',
        },
      ],
    },
  },
  'deactivated-client': {
    clientId: 'deactivated-client',
    clientName: 'Deactivated Compliance Test Client',
    appType: 'Login',
    redirectUris: ['https://deactivated.example.com/callback'],
    allowedScopes: ['openid'],
    isActive: false,
    uen: '202054321K',
    environment: 'Staging',
    hasAcceptedAgreement: true,
    jwks: {
      keys: [
        {
          kty: 'EC',
          crv: 'P-256',
          x: 'f83OJ3D2xF1Bg8vub9tLe1gHMzV76e8Tus9uPHvRVEU',
          y: 'x_FEzRu9m36HLN_tue659LNpXW6pCyStikYjKIWI5a0',
          kid: 'deactivated-client-key',
          use: 'sig',
          alg: 'ES256',
        },
      ],
    },
  },
};

export class DrizzleClientRegistry implements ClientRegistry {
  async getClientConfig(clientId: string): Promise<ClientConfig | null> {
    // 1. Check Mock Registry first (for test compatibility and rapid development)
    if (HARDENED_CLIENT_REGISTRY[clientId]) {
      return HARDENED_CLIENT_REGISTRY[clientId];
    }

    // 2. Try Database lookup
    try {
      const result = await db.select().from(clients).where(eq(clients.id, clientId)).get();
      if (!result) return null;

      return {
        clientId: result.id,
        clientName: result.name,
        appType: result.appType as 'Login' | 'Myinfo',
        uen: result.uen,
        isActive: result.isActive,
        allowedScopes: result.allowedScopes as string[],
        redirectUris: result.redirectUris as string[],
        jwks: result.jwks as any,
        jwksUri: result.jwksUri || undefined,
        siteUrl: result.siteUrl || undefined,
        appDescription: result.description || undefined,
        supportEmails: (result.supportEmails as string[]) || undefined,
        environment: result.environment as 'Staging' | 'Production',
        hasAcceptedAgreement: result.agreementAccepted,
      };
    } catch (error) {
      // If DB is not initialized or table missing, we fail gracefully
      console.warn(`[DrizzleClientRegistry] Failed to fetch client ${clientId} from DB:`, error instanceof Error ? error.message : error);
      return null;
    }
  }
}
