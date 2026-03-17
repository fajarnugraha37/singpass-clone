import { describe, it, expect, mock, beforeEach, afterEach, spyOn } from 'bun:test';
import { GetUserInfoUseCase } from '../../../src/core/use-cases/get-userinfo';
import * as jose from 'jose';

describe('GetUserInfoUseCase', () => {
  const mockRepository: any = {
    getAccessToken: mock(),
    getMyinfoProfile: mock(),
  };
  const mockCryptoService: any = {
    signAndEncrypt: mock(),
    validateDPoPNonce: mock(async () => true),
    generateDPoPNonce: mock(async () => 'fresh-nonce'),
  };
  const mockDpopValidator: any = {
    validate: mock(),
  };
  const mockJwksCache: any = {
    getClientEncryptionKey: mock(),
  };
  const mockClientRegistry: any = {
    getClientConfig: mock(),
  };
  const mockAuditService: any = {
    logEvent: mock(),
  };

  const useCase = new GetUserInfoUseCase(
    mockRepository,
    mockCryptoService,
    mockDpopValidator,
    mockJwksCache,
    mockClientRegistry,
    mockAuditService
  );

  const request = {
    accessToken: 'token-123',
    dpopProof: 'proof-123',
    method: 'GET',
    url: 'https://api.vibe.com/userinfo',
    issuer: 'https://issuer.com',
  };

  beforeEach(() => {
    spyOn(jose, 'decodeJwt').mockReturnValue({ nonce: 'valid-nonce' } as any);
  });

  afterEach(() => {
    mock.restore();
  });

  it('should successfully retrieve and encrypt userinfo', async () => {
    const tokenData = {
      userId: 'user-1',
      clientId: 'client-1',
      dpopJkt: 'jkt-1',
      scope: 'openid',
      expiresAt: new Date(Date.now() + 3600000),
    };
    mockRepository.getAccessToken.mockResolvedValueOnce(tokenData);
    mockDpopValidator.validate.mockResolvedValueOnce({ isValid: true });
    mockRepository.getMyinfoProfile.mockResolvedValueOnce({ 
      userId: 'user-1',
      uinfin: { value: 'S1234567A' }
    });
    mockClientRegistry.getClientConfig.mockResolvedValueOnce({
      clientId: 'client-1',
      jwks: { keys: [{ kid: 'k1', use: 'enc', kty: 'EC' }] }
    });
    mockCryptoService.signAndEncrypt.mockResolvedValueOnce('encrypted-payload');

    const result = await useCase.execute(request);

    expect(result).toBe('encrypted-payload');
    expect(mockAuditService.logEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'USERINFO_SUCCESS' }));
  });

  it('should throw error if token not found', async () => {
    mockRepository.getAccessToken.mockResolvedValueOnce(null);
    
    expect(useCase.execute(request)).rejects.toThrow('invalid_token');
  });

  it('should throw error if token expired', async () => {
    mockRepository.getAccessToken.mockResolvedValueOnce({
      expiresAt: new Date(Date.now() - 1000),
    });
    
    expect(useCase.execute(request)).rejects.toThrow('invalid_token');
  });

  it('should throw error if DPoP validation fails', async () => {
    mockRepository.getAccessToken.mockResolvedValueOnce({
      clientId: 'client-1',
      expiresAt: new Date(Date.now() + 3600000),
    });
    mockDpopValidator.validate.mockResolvedValueOnce({ isValid: false, error: 'Invalid htu' });
    
    expect(useCase.execute(request)).rejects.toThrow(/invalid_dpop_proof/);
  });

  it('should throw error if profile not found', async () => {
    mockRepository.getAccessToken.mockResolvedValueOnce({
      userId: 'user-1',
      expiresAt: new Date(Date.now() + 3600000),
    });
    mockDpopValidator.validate.mockResolvedValueOnce({ isValid: true });
    mockRepository.getMyinfoProfile.mockResolvedValueOnce(null);
    
    expect(useCase.execute(request)).rejects.toThrow('invalid_token');
  });

  it('should throw error if client config not found', async () => {
    mockRepository.getAccessToken.mockResolvedValueOnce({
      userId: 'user-1',
      clientId: 'client-1',
      expiresAt: new Date(Date.now() + 3600000),
    });
    mockDpopValidator.validate.mockResolvedValueOnce({ isValid: true });
    mockRepository.getMyinfoProfile.mockResolvedValueOnce({ userId: 'user-1' });
    mockClientRegistry.getClientConfig.mockResolvedValueOnce(null);
    
    expect(useCase.execute(request)).rejects.toThrow('invalid_client');
  });

  it('should throw error if no encryption key found', async () => {
    mockRepository.getAccessToken.mockResolvedValueOnce({
      userId: 'user-1',
      clientId: 'client-1',
      expiresAt: new Date(Date.now() + 3600000),
    });
    mockDpopValidator.validate.mockResolvedValueOnce({ isValid: true });
    mockRepository.getMyinfoProfile.mockResolvedValueOnce({ userId: 'user-1' });
    mockClientRegistry.getClientConfig.mockResolvedValueOnce({ clientId: 'client-1', jwks: { keys: [] } });
    
    expect(useCase.execute(request)).rejects.toThrow('no_client_encryption_key');
  });

  it('should use jwksCache if jwksUri is provided', async () => {
    mockRepository.getAccessToken.mockResolvedValueOnce({
      userId: 'user-1',
      clientId: 'client-1',
      expiresAt: new Date(Date.now() + 3600000),
    });
    mockDpopValidator.validate.mockResolvedValueOnce({ isValid: true });
    mockRepository.getMyinfoProfile.mockResolvedValueOnce({ userId: 'user-1' });
    mockClientRegistry.getClientConfig.mockResolvedValueOnce({ 
      clientId: 'client-1', 
      jwksUri: 'https://client.com/jwks' 
    });
    mockJwksCache.getClientEncryptionKey.mockResolvedValueOnce({ kid: 'k1' });
    mockCryptoService.signAndEncrypt.mockResolvedValueOnce('encrypted-payload');

    const result = await useCase.execute(request);
    expect(result).toBe('encrypted-payload');
    expect(mockJwksCache.getClientEncryptionKey).toHaveBeenCalled();
  });
});
