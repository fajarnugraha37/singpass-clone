import { describe, expect, it, mock, beforeEach } from 'bun:test';
import { Hono } from 'hono';
import * as controller from '../../src/infra/http/controllers/singpass-qr.controller';
import { QRAuthService } from '../../src/core/services/qr_auth_service';

describe('SingpassQRController', () => {
  let app: Hono;
  let mockService: QRAuthService;

  beforeEach(() => {
    mockService = {
      initQRSession: mock(() => Promise.resolve({ sessionId: '123', qrUrl: 'https://test', expiresIn: 60, state: 's' })),
      getSessionStatus: mock(() => Promise.resolve({ status: 'PENDING' })),
      handleCallback: mock(() => Promise.resolve()),
    } as any;

    app = new Hono();
    app.post('/init', controller.initQR(mockService));
    app.get('/status/:sessionId', controller.getQRStatus(mockService));
    app.get('/callback', controller.singpassCallback(mockService));
  });

  it('should return 201 on init', async () => {
    const res = await app.request('/init', {
      method: 'POST',
      headers: {
        Cookie: 'vibe_auth_session=123'
      }
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.sessionId).toBe('123');
  });

  it('should return session status', async () => {
    (mockService.getSessionStatus as any).mockImplementationOnce(() => Promise.resolve({ status: 'AUTHORIZED', redirectUrl: '/dashboard' }));
    const res = await app.request('/status/123');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('AUTHORIZED');
  });

  it('should handle expiration status', async () => {
    (mockService.getSessionStatus as any).mockImplementation(() => Promise.resolve({ status: 'EXPIRED' }));
    const res = await app.request('/status/123');
    const body = await res.json();
    expect(body.status).toBe('EXPIRED');
  });

  it('should handle callback', async () => {
    const res = await app.request('/callback?state=s&code=c');
    expect(res.status).toBe(200);
    expect(mockService.handleCallback).toHaveBeenCalled();
  });
});
