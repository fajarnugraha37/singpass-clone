import { expect, test, describe, spyOn, beforeEach } from 'bun:test'
import { RegisterParUseCase } from '../../../src/core/use-cases/register-par'
import type { CryptoService } from '../../../src/core/domain/crypto_service'
import type { PARRepository } from '../../../src/core/domain/par.types'
import type { SecurityAuditService } from '../../../src/core/domain/audit_service'
import * as jose from 'jose'

describe('RegisterParUseCase', () => {
  let mockCryptoService: CryptoService;
  let mockPARRepository: PARRepository;
  let mockClientRegistry: any;
  let mockAuditService: SecurityAuditService;
  let useCase: RegisterParUseCase;
  let validJwt: string;

  beforeEach(async () => {
    // Generate a real-ish JWT for testing
    const secret = new TextEncoder().encode('secret');
    validJwt = await new jose.SignJWT({ jti: 'test-jti' })
      .setProtectedHeader({ alg: 'HS256' })
      .sign(secret);

    mockCryptoService = {
      validateClientAssertion: async () => true,
      calculateThumbprint: async () => 'test-jkt',
      generateDPoPNonce: async () => 'test-nonce',
      validateDPoPNonce: async () => true,
    } as any;

    mockPARRepository = {
      save: async () => {},
      isJtiConsumed: async () => false,
      consumeJti: async () => {},
    } as any;

    mockClientRegistry = {
      getClientConfig: async (clientId: string) => ({
        clientId,
        clientName: 'Mock Client',
        appType: 'Login',
        redirectUris: ['https://client.example.com/cb'],
        allowedScopes: ['openid'],
        isActive: true,
        uen: 'UEN123',
        hasAcceptedAgreement: true,
        jwks: { keys: [{ kid: 'key-1' }] },
      }),
    };

    mockAuditService = {
      logEvent: async () => {},
    } as any;

    const mockDPoPValidator = {
      validate: async () => ({ isValid: true, jkt: 'test-jkt' })
    };

    const mockJWKSCacheService = {
      getClientSigningKey: async () => ({ kid: 'key-1', kty: 'RSA', n: 'test', e: 'AQAB' }),
    };

    useCase = new RegisterParUseCase(
      mockCryptoService, 
      mockPARRepository, 
      mockClientRegistry, 
      mockDPoPValidator as any,
      mockJWKSCacheService as any,
      mockAuditService
    );
  });

  test('should successfully register a valid PAR request', async () => {
    const input = {
      client_assertion: validJwt,
      client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      client_id: 'mock-client-id',
      response_type: 'code',
      scope: 'openid',
      redirect_uri: 'https://client.example.com/cb',
      code_challenge: 'challenge',
      code_challenge_method: 'S256',
      state: 'a'.repeat(30),
      nonce: 'b'.repeat(30),
      purpose: 'For testing only',
      authentication_context_type: 'APP_AUTHENTICATION_DEFAULT',
    } as any;

    const result = await useCase.execute(input);
    
    expect(result).toHaveProperty('request_uri');
    expect(result.request_uri).toMatch(/^urn:ietf:params:oauth:request_uri:/);
    expect(result).toHaveProperty('expires_in', 60);
  });

  test('should fail if purpose is missing', async () => {
    const { purpose, ...inputWithoutPurpose } = {
      ...getBaseInputForTest(),
      client_assertion: validJwt,
      client_id: 'mock-client-id',
    } as any;

    expect(useCase.execute(inputWithoutPurpose)).rejects.toThrow('purpose is required');
  });

  test('should fail if client_assertion validation fails', async () => {
    mockCryptoService.validateClientAssertion = async () => false;
    
    const input = {
      ...getBaseInputForTest(),
      client_assertion: validJwt,
      client_id: 'mock-client-id',
    } as any;

    expect(useCase.execute(input)).rejects.toThrow('Invalid client assertion');
  });

  test('should fail if jti is already consumed', async () => {
    mockPARRepository.isJtiConsumed = async () => true;
    
    const input = {
      ...getBaseInputForTest(),
      client_assertion: validJwt,
      client_id: 'mock-client-id',
    } as any;

    expect(useCase.execute(input)).rejects.toThrow('jti already used');
  });

  test('should fail if redirect_uri is missing', async () => {
    const { redirect_uri, ...inputWithoutRedirectUri } = {
      ...getBaseInputForTest(),
      client_assertion: validJwt,
      client_id: 'mock-client-id',
    } as any;

    expect(useCase.execute(inputWithoutRedirectUri)).rejects.toThrow('redirect_uri is required');
  });

  test('should fail if redirect_uri is not registered', async () => {
    const input = {
      ...getBaseInputForTest(),
      client_assertion: validJwt,
      client_id: 'mock-client-id',
      redirect_uri: 'https://malicious.com/cb',
    } as any;

    expect(useCase.execute(input)).rejects.toThrow('redirect_uri is not registered');
  });

  test('should fail if redirect_uri case does not match', async () => {
    const input = {
      ...getBaseInputForTest(),
      client_assertion: validJwt,
      client_id: 'mock-client-id',
      redirect_uri: 'https://CLIENT.example.com/cb', // Registered is lower case
    } as any;

    mockClientRegistry.getClientConfig = async (clientId: string) => ({
      clientId,
      appType: 'Login',
      redirectUris: ['https://client.example.com/cb'],
      allowedScopes: ['openid'],
      isActive: true,
      uen: 'UEN123',
      hasAcceptedAgreement: true,
      jwks: { keys: [{ kid: 'key-1' }] },
    });

    expect(useCase.execute(input)).rejects.toThrow('redirect_uri is not registered');
  });

  test('should fail if client has no registered redirect URIs', async () => {
    const input = {
      ...getBaseInputForTest(),
      client_assertion: validJwt,
      client_id: 'mock-client-id',
    } as any;

    mockClientRegistry.getClientConfig = async (clientId: string) => ({
      clientId,
      appType: 'Login',
      redirectUris: [],
      allowedScopes: ['openid'],
      isActive: true,
      uen: 'UEN123',
      hasAcceptedAgreement: true,
      jwks: { keys: [{ kid: 'key-1' }] },
    });

    expect(useCase.execute(input)).rejects.toThrow('redirect_uri is not registered');
  });

  test('should succeed if redirect_uri matches exactly one of many registered URIs', async () => {
    const input = {
      ...getBaseInputForTest(),
      client_assertion: validJwt,
      client_id: 'mock-client-id',
      redirect_uri: 'https://client.example.com/cb2',
    } as any;

    mockClientRegistry.getClientConfig = async (clientId: string) => ({
      clientId,
      appType: 'Login',
      redirectUris: ['https://client.example.com/cb1', 'https://client.example.com/cb2'],
      allowedScopes: ['openid'],
      isActive: true,
      uen: 'UEN123',
      hasAcceptedAgreement: true,
      jwks: { keys: [{ kid: 'key-1' }] },
    });

    const result = await useCase.execute(input);
    expect(result).toHaveProperty('request_uri');
  });

  function getBaseInputForTest() {
    return {
      response_type: 'code',
      scope: 'openid',
      redirect_uri: 'https://client.example.com/cb',
      code_challenge: 'challenge',
      code_challenge_method: 'S256',
      state: 'a'.repeat(30),
      nonce: 'b'.repeat(30),
      purpose: 'For testing',
      authentication_context_type: 'APP_AUTHENTICATION_DEFAULT',
    };
  }
});
