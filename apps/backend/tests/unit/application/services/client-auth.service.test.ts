import { expect, test, describe, beforeEach, mock } from 'bun:test';
import { ClientAuthenticationService } from '../../../../src/core/application/services/client-auth.service';
import type { CryptoService } from '../../../../src/core/domain/crypto_service';
import type { ClientRegistry } from '../../../../src/core/domain/client_registry';
import type { JtiStore } from '../../../../src/core/utils/dpop_validator';
import * as jose from 'jose';

describe('ClientAuthenticationService', () => {
  let cryptoService: CryptoService;
  let clientRegistry: ClientRegistry;
  let jtiStore: JtiStore;
  let service: ClientAuthenticationService;

  let testPrivateKey: jose.CryptoKey;

  beforeEach(async () => {
    const keyPair = await jose.generateKeyPair('ES256');
    testPrivateKey = keyPair.privateKey;
    
    cryptoService = {
      validateClientAssertion: mock(async () => true),
    } as any;
    clientRegistry = {
      getClientConfig: mock(async () => ({
        clientId: 'client-1',
        jwks: {
          keys: [
            {
              kid: 'key-1',
              use: 'sig',
              kty: 'EC',
              crv: 'P-256',
              x: '...',
              y: '...',
            },
          ],
        },
      })),
    } as any;
    jtiStore = {
      isUsed: mock(async () => false),
      markUsed: mock(async () => {}),
    };
    service = new ClientAuthenticationService(cryptoService, clientRegistry, jtiStore);
  });

  async function createAssertion(payload: any, keyId = 'key-1') {
    return await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: 'ES256', kid: keyId })
      .sign(testPrivateKey);
  }

  test('should authenticate a valid assertion', async () => {
    const assertion = await createAssertion({ iss: 'client-1', sub: 'client-1', jti: 'new-jti' });
    const result = await service.authenticate(assertion, 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer');
    expect(result.clientId).toBe('client-1');
  });

  test('should fail if jti has already been used', async () => {
    (jtiStore.isUsed as any).mockImplementation(async () => true);
    const assertion = await createAssertion({ iss: 'client-1', sub: 'client-1', jti: 'reused-jti' });
    
    expect(service.authenticate(assertion, 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer'))
      .rejects.toThrow('jti has already been used');
  });

  test('should mark jti as used after successful authentication', async () => {
    const assertion = await createAssertion({ iss: 'client-1', sub: 'client-1', jti: 'new-jti', exp: Math.floor(Date.now() / 1000) + 60 });
    await service.authenticate(assertion, 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer');
    
    expect(jtiStore.markUsed).toHaveBeenCalled();
    const args = (jtiStore.markUsed as any).mock.calls[0];
    expect(args[0]).toBe('new-jti');
    expect(args[1]).toBe('client-1');
    expect(args[2]).toBeInstanceOf(Date);
  });
});
