import { describe, it, expect, mock, beforeEach, afterEach } from 'bun:test';
import { Hono } from 'hono';
import { createUserinfoRouter } from '../../src/infra/http/routes/userinfo-routes';

describe('UserInfo Router', () => {
  let app: Hono;
  const mockValidateUseCase: any = { execute: mock() };
  const mockGenerateUseCase: any = { execute: mock() };
  const mockRepository: any = { getMyinfoProfile: mock() };
  const mockClientRegistry: any = { getClientConfig: mock() };
  const mockJwksCache: any = { getClientEncryptionKey: mock() };
  const mockAuditService: any = { logEvent: mock() };
  const issuer = 'https://issuer.com';

  beforeEach(() => {
    app = new Hono();
    const router = createUserinfoRouter(
      mockValidateUseCase,
      mockGenerateUseCase,
      mockRepository,
      mockClientRegistry,
      mockJwksCache,
      mockAuditService,
      issuer
    );
    app.route('/userinfo', router);
  });

  afterEach(() => {
    mock.restore();
  });

  it('should return 401 if Authorization header is missing', async () => {
    const res = await app.request('/userinfo', { method: 'GET' });
    expect(res.status).toBe(401);
    const data: any = await res.json();
    expect(data.error).toBe('invalid_request');
    expect(res.headers.get('WWW-Authenticate')).toContain('invalid_request');
  });

  it('should return 401 if DPoP header is missing', async () => {
    const res = await app.request('/userinfo', {
      method: 'GET',
      headers: { 'Authorization': 'DPoP token' }
    });
    expect(res.status).toBe(401);
    const data: any = await res.json();
    expect(data.error).toBe('invalid_dpop_proof');
  });

  it('should return 401 if token validation fails', async () => {
    mockValidateUseCase.execute.mockRejectedValueOnce(new Error('invalid_token'));
    
    const res = await app.request('/userinfo', {
      method: 'GET',
      headers: { 'Authorization': 'DPoP token', 'DPoP': 'proof' }
    });
    expect(res.status).toBe(401);
    const data: any = await res.json();
    expect(data.error).toBe('invalid_token');
  });

  it('should return 401 if DPoP validation fails', async () => {
    mockValidateUseCase.execute.mockRejectedValueOnce(new Error('invalid_dpop_proof: Key mismatch'));
    
    const res = await app.request('/userinfo', {
      method: 'GET',
      headers: { 'Authorization': 'DPoP token', 'DPoP': 'proof' }
    });
    expect(res.status).toBe(401);
    const data: any = await res.json();
    expect(data.error).toBe('invalid_dpop_proof');
    expect(data.error_description).toBe('Key mismatch');
  });

  it('should return 401 if profile not found', async () => {
    mockValidateUseCase.execute.mockResolvedValueOnce({ userId: 'user-1', clientId: 'client-1' });
    mockRepository.getMyinfoProfile.mockResolvedValueOnce(null);
    
    const res = await app.request('/userinfo', {
      method: 'GET',
      headers: { 'Authorization': 'DPoP token', 'DPoP': 'proof' }
    });
    expect(res.status).toBe(401);
    expect((await res.json() as any).error).toBe('invalid_token');
  });

  it('should return 401 if client not found', async () => {
    mockValidateUseCase.execute.mockResolvedValueOnce({ userId: 'user-1', clientId: 'client-1' });
    mockRepository.getMyinfoProfile.mockResolvedValueOnce({ userId: 'user-1' });
    mockClientRegistry.getClientConfig.mockResolvedValueOnce(null);
    
    const res = await app.request('/userinfo', {
      method: 'GET',
      headers: { 'Authorization': 'DPoP token', 'DPoP': 'proof' }
    });
    expect(res.status).toBe(401);
    expect((await res.json() as any).error).toBe('invalid_request');
  });

  it('should return 401 if no client encryption key found', async () => {
    mockValidateUseCase.execute.mockResolvedValueOnce({ userId: 'user-1', clientId: 'client-1' });
    mockRepository.getMyinfoProfile.mockResolvedValueOnce({ userId: 'user-1' });
    mockClientRegistry.getClientConfig.mockResolvedValueOnce({ clientId: 'client-1', jwks: { keys: [] } });
    
    const res = await app.request('/userinfo', {
      method: 'GET',
      headers: { 'Authorization': 'DPoP token', 'DPoP': 'proof' }
    });
    expect(res.status).toBe(401);
    const data: any = await res.json();
    expect(data.error).toBe('invalid_request');
    expect(data.error_description).toContain('encryption key not found');
  });

  it('should handle jwksUri for client encryption key', async () => {
    mockValidateUseCase.execute.mockResolvedValueOnce({ userId: 'user-1', clientId: 'client-1' });
    mockRepository.getMyinfoProfile.mockResolvedValueOnce({ userId: 'user-1' });
    mockClientRegistry.getClientConfig.mockResolvedValueOnce({ clientId: 'client-1', jwksUri: 'https://client.com/jwks' });
    mockJwksCache.getClientEncryptionKey.mockResolvedValueOnce({ kid: 'key-1' });
    mockGenerateUseCase.execute.mockResolvedValueOnce('signed-jwe');

    const res = await app.request('/userinfo', {
      method: 'GET',
      headers: { 'Authorization': 'DPoP token', 'DPoP': 'proof' }
    });
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('signed-jwe');
  });

  it('should return 500 for unexpected errors', async () => {
    mockValidateUseCase.execute.mockRejectedValueOnce(new Error('Database explosion'));
    
    const res = await app.request('/userinfo', {
      method: 'GET',
      headers: { 'Authorization': 'DPoP token', 'DPoP': 'proof' }
    });
    expect(res.status).toBe(500);
    expect((await res.json() as any).error).toBe('server_error');
  });
});
