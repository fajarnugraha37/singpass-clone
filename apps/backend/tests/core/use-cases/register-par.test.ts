import { expect, test, describe, spyOn, beforeEach } from 'bun:test'
import { RegisterParUseCase } from '../../../src/core/use-cases/register-par'
import type { CryptoService } from '../../../src/core/domain/crypto_service'
import type { PARRepository } from '../../../src/core/domain/par.types'
import type { SecurityAuditService } from '../../../src/core/domain/audit_service'
import * as jose from 'jose'

describe('RegisterParUseCase', () => {
  let mockCryptoService: CryptoService;
  let mockPARRepository: PARRepository;
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
      validateDPoPProof: async () => ({ jkt: 'test-jkt' }),
      calculateThumbprint: async () => 'test-jkt',
    } as any;

    mockPARRepository = {
      save: async () => {},
      isJtiConsumed: async () => false,
      consumeJti: async () => {},
    } as any;

    mockAuditService = {
      logEvent: async () => {},
    } as any;

    useCase = new RegisterParUseCase(mockCryptoService, mockPARRepository, mockAuditService);
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
      state: 'state',
      nonce: 'nonce',
      authentication_context_type: 'login',
    } as any;

    const result = await useCase.execute(input);
    
    expect(result).toHaveProperty('request_uri');
    expect(result.request_uri).toMatch(/^urn:ietf:params:oauth:request_uri:/);
    expect(result).toHaveProperty('expires_in', 300);
  });

  test('should fail if client_assertion validation fails', async () => {
    mockCryptoService.validateClientAssertion = async () => false;
    
    const input = {
      client_assertion: validJwt,
      client_id: 'mock-client-id',
    } as any;

    expect(useCase.execute(input)).rejects.toThrow('Invalid client assertion');
  });

  test('should fail if jti is already consumed', async () => {
    mockPARRepository.isJtiConsumed = async () => true;
    
    const input = {
      client_assertion: validJwt,
      client_id: 'mock-client-id',
    } as any;

    expect(useCase.execute(input)).rejects.toThrow('jti already used');
  });
});
