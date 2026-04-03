import { describe, expect, it, mock, beforeEach, beforeAll } from 'bun:test';
import { QRAuthService } from '../../src/core/services/qr_auth_service';
import type { NDIPort } from '../../src/core/domain/ndi.port';
import type { UserInfoRepository } from '../../src/core/domain/userinfo_repository';
import type { CryptoService } from '../../src/core/domain/crypto_service';
import type { GenerateAuthCodeUseCase } from '../../src/core/use-cases/GenerateAuthCode';
import * as jose from 'jose';
import { getDb, db } from '../../src/infra/database/client';
import { authSessions, qrSessions, users, serverKeys } from '../../src/infra/database/schema';
import { eq } from 'drizzle-orm';

describe('QRAuthService', () => {
  let service: QRAuthService;
  let mockNDIAdapter: NDIPort;
  let mockUserInfoRepo: UserInfoRepository;
  let mockCryptoService: CryptoService;
  let mockGenerateAuthCodeUseCase: GenerateAuthCodeUseCase;

  beforeAll(async () => {
    await getDb();
  });

  beforeEach(async () => {
    process.env.SINGPASS_CLIENT_ID = 'test-client';
    process.env.SINGPASS_REDIRECT_URI = 'https://rp.example.com/callback';
    
    // Clean DB
    await db.delete(qrSessions);
    await db.delete(authSessions);
    await db.delete(users);
    await db.delete(serverKeys);

    const { privateKey, publicKey } = await jose.generateKeyPair('ES256', { extractable: true });
    const idToken = await new jose.SignJWT({ sub: 'user1' })
      .setProtectedHeader({ alg: 'ES256' })
      .sign(privateKey);

    mockNDIAdapter = {
      pushAuthorizationRequest: mock(() => Promise.resolve({ request_uri: 'urn:test:uri', expires_in: 60 })),
      exchangeToken: mock(() => Promise.resolve({ id_token: idToken, access_token: 'at' })),
      getUserInfo: mock(() => Promise.resolve({ sub: 'user1' })),
    } as any;
    
    mockCryptoService = {
      getActiveKey: mock(() => Promise.resolve({ privateKey, publicKey: publicKey as any })),
      calculateThumbprint: mock(() => Promise.resolve('test-jkt')),
    } as any;

    mockUserInfoRepo = {
      getUserByNric: mock(() => Promise.resolve({ id: 'user-123' })),
    } as any;

    mockGenerateAuthCodeUseCase = {
      execute: mock(() => Promise.resolve({ redirectUri: 'https://rp.example.com/callback?code=123', code: '123' }))
    } as any;

    service = new QRAuthService(mockNDIAdapter, mockUserInfoRepo, mockCryptoService, mockGenerateAuthCodeUseCase);
  });

  it('should initialize a QR session', async () => {
    // Setup parent session
    await db.insert(authSessions).values({
      id: 'parent-123',
      clientId: 'test-client',
      redirectUri: 'https://rp.example.com/callback',
      parRequestUri: 'urn:ietf:params:oauth:request_uri:parent',
      state: 'parent-state',
      nonce: 'parent-nonce',
      purpose: 'test-purpose',
      status: 'INITIATED',
      expiresAt: new Date(Date.now() + 60000),
    });

    const result = await service.initQRSession('parent-123');

    expect(result.sessionId).toBeDefined();
    expect(result.qrUrl).toContain('request_uri=urn:test:uri');
    expect(mockNDIAdapter.pushAuthorizationRequest).toHaveBeenCalled();
  });

  it('should return session status', async () => {
    await db.insert(qrSessions).values({
      id: 'session-123',
      clientId: 'test-client',
      state: 'state123',
      nonce: 'nonce123',
      requestUri: 'urn:test:uri',
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 60000),
      codeVerifier: 'verifier123',
    });

    const result = await service.getSessionStatus('session-123');
    expect(result.status).toBe('PENDING');
  });

  it('should handle callback success', async () => {
    await db.insert(qrSessions).values({
      id: 'session-123',
      clientId: 'test-client',
      state: 'state123',
      nonce: 'nonce123',
      requestUri: 'urn:test:uri',
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 60000),
      codeVerifier: 'verifier123',
    });

    await service.handleCallback('state123', 'code123');
    
    expect(mockNDIAdapter.exchangeToken).toHaveBeenCalled();
    const [session] = await db.select().from(qrSessions).where(eq(qrSessions.id, 'session-123'));
    expect(session.status).toBe('AUTHORIZED');
  });

  it('should handle callback cancellation', async () => {
    await db.insert(qrSessions).values({
      id: 'session-123',
      clientId: 'test-client',
      state: 'state123',
      nonce: 'nonce123',
      requestUri: 'urn:test:uri',
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 60000),
      codeVerifier: 'verifier123',
    });

    await service.handleCallback('state123', undefined, 'user_cancelled');
    const [session] = await db.select().from(qrSessions).where(eq(qrSessions.id, 'session-123'));
    expect(session.status).toBe('CANCELLED');
  });
});