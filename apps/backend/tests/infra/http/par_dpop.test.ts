import { expect, test, describe, beforeEach, spyOn, afterEach, mock } from 'bun:test'
import app from '../../../src/index'
import { JoseCryptoService } from '../../../src/infra/adapters/jose_crypto'
import { DPoPValidator } from '../../../src/core/utils/dpop_validator'
import * as jose from 'jose'

describe('PAR DPoP Integration', () => {
  let validJwt: string;

  beforeEach(async () => {
    const secret = new TextEncoder().encode('secret');
    validJwt = await new jose.SignJWT({ jti: crypto.randomUUID() })
      .setProtectedHeader({ alg: 'HS256' })
      .sign(secret);
    
    spyOn(JoseCryptoService.prototype, 'validateClientAssertion').mockImplementation(async () => true);
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

    const params = new URLSearchParams({
      client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      client_assertion: validJwt,
      client_id: 'mock-client-id',
      response_type: 'code',
      scope: 'openid',
      redirect_uri: 'http://localhost:3000/callback',
      state: 'test-state',
      nonce: 'test-nonce',
      code_challenge: 'test-challenge',
      code_challenge_method: 'S256',
      authentication_context_type: 'APP_AUTHENTICATION_DEFAULT',
    });

    const res = await app.request('/api/par', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'DPoP': 'mock-proof'
      },
      body: params.toString(),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error_description).toContain('invalid_htu');
  });

  test('should fail if DPoP validation returns jti_reused', async () => {
    spyOn(DPoPValidator.prototype, 'validate').mockImplementation(async () => ({
      isValid: false,
      jkt: '',
      error: 'jti_reused'
    }));

    const params = new URLSearchParams({
      client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      client_assertion: validJwt,
      client_id: 'mock-client-id',
      response_type: 'code',
      scope: 'openid',
      redirect_uri: 'http://localhost:3000/callback',
      state: 'test-state',
      nonce: 'test-nonce',
      code_challenge: 'test-challenge',
      code_challenge_method: 'S256',
      authentication_context_type: 'APP_AUTHENTICATION_DEFAULT',
    });

    const res = await app.request('/api/par', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'DPoP': 'mock-proof'
      },
      body: params.toString(),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error_description).toContain('jti_reused');
  });
});
