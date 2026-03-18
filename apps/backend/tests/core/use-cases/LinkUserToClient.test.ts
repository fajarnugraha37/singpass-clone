import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { LinkUserToClientUseCase } from '../../../src/core/use-cases/LinkUserToClient';
import { UserInfoRepository } from '../../../src/core/domain/userinfo_repository';
import { ClientRegistry } from '../../../src/core/domain/client_registry';

describe('LinkUserToClientUseCase', () => {
  let useCase: LinkUserToClientUseCase;
  let mockUserInfoRepo: UserInfoRepository;
  let mockClientRegistry: ClientRegistry;

  beforeEach(() => {
    mockUserInfoRepo = {
      isUserLinkedToClient: mock(() => Promise.resolve(false)),
      countUsersByClient: mock(() => Promise.resolve(0)),
      linkUserToClient: mock(() => Promise.resolve()),
    } as any;

    mockClientRegistry = {
      getClientConfig: mock((id) => Promise.resolve({
        clientId: id,
        environment: 'Staging',
      }))
    } as any;

    useCase = new LinkUserToClientUseCase(mockUserInfoRepo, mockClientRegistry);
  });

  it('should link user if limit not reached in Staging', async () => {
    (mockUserInfoRepo.countUsersByClient as any).mockResolvedValue(99);
    
    const result = await useCase.execute({ userId: 'user-1', clientId: 'client-1' });
    
    expect(result.success).toBe(true);
    expect(mockUserInfoRepo.linkUserToClient).toHaveBeenCalledWith('user-1', 'client-1');
  });

  it('should fail if limit reached in Staging', async () => {
    (mockUserInfoRepo.countUsersByClient as any).mockResolvedValue(100);
    
    expect(useCase.execute({ userId: 'user-1', clientId: 'client-1' }))
      .rejects.toThrow('PRECONDITION_FAILED: Staging account limit (100) reached');
  });

  it('should NOT enforce limit in Production', async () => {
    (mockClientRegistry.getClientConfig as any).mockResolvedValue({
      clientId: 'client-1',
      environment: 'Production',
    });
    (mockUserInfoRepo.countUsersByClient as any).mockResolvedValue(150);
    
    const result = await useCase.execute({ userId: 'user-1', clientId: 'client-1' });
    
    expect(result.success).toBe(true);
    expect(mockUserInfoRepo.linkUserToClient).toHaveBeenCalled();
  });

  it('should return success if already linked', async () => {
    (mockUserInfoRepo.isUserLinkedToClient as any).mockResolvedValue(true);
    
    const result = await useCase.execute({ userId: 'user-1', clientId: 'client-1' });
    
    expect(result.success).toBe(true);
    expect(result.message).toBe('User already linked to this client');
    expect(mockUserInfoRepo.linkUserToClient).not.toHaveBeenCalled();
  });
});
