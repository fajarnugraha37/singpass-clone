import { expect, describe, it, mock, spyOn, afterEach } from 'bun:test';
import { ValidateUserInfoRequestUseCase } from '../../../../src/application/usecases/validate-userinfo-request';
import * as jose from 'jose';

describe('ValidateUserInfoRequestUseCase', () => {
  const mockCryptoService = {
    validateDPoPNonce: mock(async () => true),
    generateDPoPNonce: mock(async () => 'fresh-nonce'),
  } as any;

  afterEach(() => {
    mock.restore();
  });

  it('should return token data if validation passes', async () => {
    spyOn(jose, 'decodeJwt').mockReturnValue({ nonce: 'valid-nonce' } as any);
    const mockTokenData = {
      clientId: 'client-1',
      dpopJkt: 'jkt-1',
      expiresAt: new Date(Date.now() + 3600000)
    };
    
    const mockRepository = {
      getAccessToken: mock(async () => mockTokenData),
    } as any;
    
    const mockDpopValidator = {
      validate: mock(async () => ({ isValid: true })),
    } as any;

    const useCase = new ValidateUserInfoRequestUseCase(mockRepository, mockDpopValidator, mockCryptoService);
    
    const result = await useCase.execute('token-1', 'proof-1', 'GET', 'https://url.com');

    expect(result).toBe(mockTokenData as any);
    expect(mockRepository.getAccessToken).toHaveBeenCalledWith('token-1');
    expect(mockDpopValidator.validate).toHaveBeenCalled();
  });

  it('should throw invalid_token if token not found', async () => {
    const mockRepository = {
      getAccessToken: mock(async () => null),
    } as any;
    
    const useCase = new ValidateUserInfoRequestUseCase(mockRepository, {} as any, mockCryptoService);
    
    expect(useCase.execute('token-1', 'proof-1', 'GET', 'https://url.com')).rejects.toThrow('invalid_token');
  });

  it('should throw if DPoP validation fails', async () => {
    spyOn(jose, 'decodeJwt').mockReturnValue({ nonce: 'valid-nonce' } as any);
    const mockTokenData = {
      clientId: 'client-1',
      dpopJkt: 'jkt-1',
      expiresAt: new Date(Date.now() + 3600000)
    };
    
    const mockRepository = {
      getAccessToken: mock(async () => mockTokenData),
    } as any;
    
    const mockDpopValidator = {
      validate: mock(async () => ({ isValid: false, error: 'Wrong JKT' })),
    } as any;

    const useCase = new ValidateUserInfoRequestUseCase(mockRepository, mockDpopValidator, mockCryptoService);
    
    expect(useCase.execute('token-1', 'proof-1', 'GET', 'https://url.com')).rejects.toThrow(/invalid_dpop_proof/);
  });
});
