import { expect, describe, it, mock } from 'bun:test';
import { GenerateUserInfoPayloadUseCase } from '../../../../src/application/usecases/generate-userinfo-payload';
import { createEmptyMyinfoPerson } from '../../../../src/core/domain/myinfo-person';

describe('GenerateUserInfoPayloadUseCase', () => {
  it('should generate a signed and encrypted payload', async () => {
    const mockCryptoService = {
      signAndEncrypt: mock(async () => 'encrypted-jwe'),
    } as any;
    
    const useCase = new GenerateUserInfoPayloadUseCase(mockCryptoService);
    const person = createEmptyMyinfoPerson('user-1');
    const clientPublicKey = { kid: 'key-1' } as any;
    const issuer = 'https://issuer.com';
    const clientId = 'client-1';

    const result = await useCase.execute(person, clientPublicKey, issuer, clientId);

    expect(result).toBe('encrypted-jwe');
    expect(mockCryptoService.signAndEncrypt).toHaveBeenCalled();
    
    const [payload, key] = (mockCryptoService.signAndEncrypt as any).mock.calls[0];
    expect(payload.sub).toBe('user-1');
    expect(payload.person_info).toBeDefined();
    expect(key).toBe(clientPublicKey);
  });
});
