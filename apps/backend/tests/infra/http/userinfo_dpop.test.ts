import { expect, test, describe, beforeEach, spyOn, afterEach, mock } from 'bun:test'
import app from '../../../src/index'
import { DPoPValidator } from '../../../src/core/utils/dpop_validator'
import { DrizzleUserInfoRepository } from '../../../src/infra/adapters/db/drizzle_userinfo_repository'
import { JoseCryptoService } from '../../../src/infra/adapters/jose_crypto'
import * as jose from 'jose'

describe('UserInfo Endpoint DPoP Integration', () => {
  beforeEach(async () => {
    spyOn(jose, 'decodeJwt').mockReturnValue({ nonce: 'valid-nonce' } as any);
    spyOn(JoseCryptoService.prototype, 'validateDPoPNonce').mockImplementation(async () => true);
    
    spyOn(DrizzleUserInfoRepository.prototype, 'getAccessToken').mockImplementation(async () => ({
      token: 'valid-token',
      userId: 'user-1',
      clientId: 'client-1',
      dpopJkt: 'valid-jkt',
      scope: 'openid',
      loa: 1,
      amr: ['pwd'],
      expiresAt: new Date(Date.now() + 3600 * 1000),
      revoked: false,
      createdAt: new Date()
    }));
  });

  afterEach(() => {
    mock.restore();
  });

  test('should fail if DPoP validation returns invalid_htu', async () => {
    spyOn(DPoPValidator.prototype, 'validate').mockImplementation(async () => ({
      isValid: false,
      jkt: '',
      error: 'invalid_htu'
    }));

    const res = await app.request('/api/userinfo', {
      method: 'GET',
      headers: {
        'Authorization': 'DPoP valid-token',
        'DPoP': 'mock-proof'
      },
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('invalid_dpop_proof');
    expect(body.error_description).toContain('invalid_htu');
    expect(res.headers.get('WWW-Authenticate')).toContain('invalid_dpop_proof');
  });

  test('should fail if DPoP validation returns jti_reused', async () => {
    spyOn(DPoPValidator.prototype, 'validate').mockImplementation(async () => ({
      isValid: false,
      jkt: '',
      error: 'jti_reused'
    }));

    const res = await app.request('/api/userinfo', {
      method: 'GET',
      headers: {
        'Authorization': 'DPoP valid-token',
        'DPoP': 'mock-proof'
      },
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('invalid_dpop_proof');
    expect(body.error_description).toContain('jti_reused');
    expect(res.headers.get('WWW-Authenticate')).toContain('jti_reused');
  });
});
