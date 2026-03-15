import { expect, describe, it, mock } from 'bun:test';
import { ValidateUserInfoRequestUseCase } from '../../../../src/application/usecases/validate-userinfo-request';

describe('ValidateUserInfoRequestUseCase', () => {
  it('should return token data if validation passes', async () => {
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

    const useCase = new ValidateUserInfoRequestUseCase(mockRepository, mockDpopValidator);
    
    const result = await useCase.execute('token-1', 'proof-1', 'GET', 'https://url.com');

    expect(result).toBe(mockTokenData as any);
    expect(mockRepository.getAccessToken).toHaveBeenCalledWith('token-1');
    expect(mockDpopValidator.validate).toHaveBeenCalled();
  });

  it('should throw invalid_token if token not found', async () => {
    const mockRepository = {
      getAccessToken: mock(async () => null),
    } as any;
    
    const useCase = new ValidateUserInfoRequestUseCase(mockRepository, {} as any);
    
    expect(useCase.execute('token-1', 'proof-1', 'GET', 'https://url.com')).rejects.toThrow('invalid_token');
  });

  it('should throw if DPoP validation fails', async () => {
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

    const useCase = new ValidateUserInfoRequestUseCase(mockRepository, mockDpopValidator);
    
    expect(useCase.execute('token-1', 'proof-1', 'GET', 'https://url.com')).rejects.toThrow(/invalid_dpop_proof/);
  });
});
