import type { JWK } from 'jose';
import type { ClientRegistry, ClientConfig } from '../../core/domain/client_registry';

// Mock registry for development/testing
export const MOCK_CLIENT_REGISTRY: Record<string, ClientConfig> = {
  'mock-client-id': {
    clientId: 'mock-client-id',
    clientName: 'Mock Client Application',
    redirectUris: ['http://localhost:3000/callback'],
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
      ],
    },
  },
  'test-client': {
    clientId: 'test-client',
    clientName: 'Test Client',
    redirectUris: ['http://localhost:3000/cb'],
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
};

export class DrizzleClientRegistry implements ClientRegistry {
  async getClientConfig(clientId: string): Promise<ClientConfig | null> {
    return MOCK_CLIENT_REGISTRY[clientId] || null;
  }
}

export function getClientConfig(clientId: string): ClientConfig | null {
  return MOCK_CLIENT_REGISTRY[clientId] || null;
}
