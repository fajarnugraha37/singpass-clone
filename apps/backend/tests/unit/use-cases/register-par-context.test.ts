import { expect, test, describe, beforeEach, spyOn } from 'bun:test'
import { RegisterParUseCase } from '../../../src/core/use-cases/register-par'
import type { CryptoService } from '../../../src/core/domain/crypto_service'
import type { PARRepository } from '../../../src/core/domain/par.types'
import type { SecurityAuditService } from '../../../src/core/domain/audit_service'
import { AuthenticationContextType } from '../../../../../packages/shared/src/config'
import * as jose from 'jose'

describe('RegisterParUseCase - Context Validation', () => {
  let mockCryptoService: CryptoService;
  let mockPARRepository: PARRepository;
  let mockClientRegistry: any;
  let mockAuditService: SecurityAuditService;
  let useCase: RegisterParUseCase;
  let validJwt: string;

  beforeEach(async () => {
    const secret = new TextEncoder().encode('secret');
    validJwt = await new jose.SignJWT({ jti: 'test-jti' })
      .setProtectedHeader({ alg: 'HS256' })
      .sign(secret);

    mockCryptoService = {
      validateClientAssertion: async () => true,
      validateDPoPProof: async () => ({ jkt: 'test-jkt' }),
    } as any;

    mockPARRepository = {
      save: async () => {},
      isJtiConsumed: async () => false,
      consumeJti: async () => {},
    } as any;

    mockAuditService = {
      logEvent: async () => {},
    } as any;

    // Default mock registry
    mockClientRegistry = {
      getClientConfig: async (clientId: string) => ({
        clientId,
        clientName: 'Mock Client',
        appType: 'Login',
        redirectUris: ['https://client.example.com/cb'],
        jwks: { keys: [{ kid: 'key-1' }] },
      }),
    };

    useCase = new RegisterParUseCase(mockCryptoService, mockPARRepository, mockClientRegistry, mockAuditService);
  });

  const getBaseInput = () => ({
    client_assertion: validJwt,
    client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
    client_id: 'mock-client-id',
    response_type: 'code',
    scope: 'openid',
    redirect_uri: 'https://client.example.com/cb',
    code_challenge: 'challenge',
    code_challenge_method: 'S256',
    state: 'state',
    nonce: 'nonce',
  });

  // US1: Mandatory context type for Login apps
  test('should fail if Login app misses authentication_context_type', async () => {
    const input = getBaseInput();
    
    expect(useCase.execute(input)).rejects.toThrow('authentication_context_type is mandatory for Login apps');
  });

  test('should succeed if Login app provides valid authentication_context_type', async () => {
    const saveSpy = spyOn(mockPARRepository, 'save');
    const input = {
      ...getBaseInput(),
      authentication_context_type: AuthenticationContextType.APP_AUTHENTICATION_DEFAULT,
      authentication_context_message: 'Authorize login',
    };

    const result = await useCase.execute(input);
    expect(result).toHaveProperty('request_uri');
    
    // T010: Verify correctly stored in payload
    const savedRequest = saveSpy.mock.calls[0][0] as any;
    expect(savedRequest.payload).toHaveProperty('authentication_context_type', AuthenticationContextType.APP_AUTHENTICATION_DEFAULT);
    expect(savedRequest.payload).toHaveProperty('authentication_context_message', 'Authorize login');
  });

  test('should fail if Login app provides invalid authentication_context_type', async () => {
    const input = {
      ...getBaseInput(),
      authentication_context_type: 'INVALID_TYPE',
    };

    expect(useCase.execute(input)).rejects.toThrow('authentication_context_type must be a valid Singpass enum');
  });

  // US2: Transaction Context Message validation (T011 - I'll add it now as it belongs to the same file)
  test('should fail if authentication_context_message exceeds 100 characters', async () => {
    const input = {
      ...getBaseInput(),
      authentication_context_type: AuthenticationContextType.APP_AUTHENTICATION_DEFAULT,
      authentication_context_message: 'a'.repeat(101),
    };

    expect(useCase.execute(input)).rejects.toThrow('authentication_context_message exceeds 100 characters or contains invalid characters');
  });

  test('should fail if authentication_context_message contains invalid characters', async () => {
    const input = {
      ...getBaseInput(),
      authentication_context_type: AuthenticationContextType.APP_AUTHENTICATION_DEFAULT,
      authentication_context_message: 'Invalid context $message',
    };

    expect(useCase.execute(input)).rejects.toThrow('authentication_context_message exceeds 100 characters or contains invalid characters');
  });

  // US3: Myinfo App restriction (T014, T015)
  test('should fail if Myinfo app provides authentication_context_type', async () => {
    mockClientRegistry.getClientConfig = async (clientId: string) => ({
      clientId,
      clientName: 'Myinfo Client',
      appType: 'Myinfo',
      redirectUris: ['https://client.example.com/cb'],
      jwks: { keys: [{ kid: 'key-1' }] },
    });

    const input = {
      ...getBaseInput(),
      authentication_context_type: AuthenticationContextType.APP_AUTHENTICATION_DEFAULT,
    };

    expect(useCase.execute(input)).rejects.toThrow('authentication_context parameters are only allowed for Login apps');
  });

  test('should succeed if Myinfo app does NOT provide context parameters', async () => {
    mockClientRegistry.getClientConfig = async (clientId: string) => ({
      clientId,
      clientName: 'Myinfo Client',
      appType: 'Myinfo',
      redirectUris: ['https://client.example.com/cb'],
      jwks: { keys: [{ kid: 'key-1' }] },
    });

    const input = getBaseInput();

    const result = await useCase.execute(input);
    expect(result).toHaveProperty('request_uri');
  });
});
