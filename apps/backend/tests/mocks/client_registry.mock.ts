import type { ClientConfig } from '../../../src/core/domain/client_registry';

/**
 * Mock registry for testing purposes only.
 * This should NOT be used in production.
 */
export const MOCK_CLIENT_REGISTRY: Record<string, ClientConfig> = {
  'mock-client-id': {
    clientId: 'mock-client-id',
    clientName: 'Mock Client Application',
    appType: 'Login',
    redirectUris: ['https://localhost/callback'],
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
    clientName: 'Test Client',
    appType: 'Myinfo',
    redirectUris: ['https://localhost/cb'],
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
