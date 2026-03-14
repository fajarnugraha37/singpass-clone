import { expect, test, describe, beforeEach, spyOn, afterEach, mock } from 'bun:test'
import app from '../../../src/index'
import { DPoPValidator } from '../../../src/core/utils/dpop_validator'
import { ClientAuthenticationService } from '../../../src/core/application/services/client-auth.service'
import * as jose from 'jose'

describe('Token Endpoint DPoP Integration', () => {
  beforeEach(async () => {
    spyOn(ClientAuthenticationService.prototype, 'authenticate').mockImplementation(async () => ({ clientId: 'mock-client-id' }));
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
      grant_type: 'authorization_code',
      code: 'test-code',
      redirect_uri: 'http://localhost:3000/callback',
      code_verifier: 'test-verifier',
      client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      client_assertion: 'mock-assertion'
    });

    const res = await app.request('/api/token', {
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
      grant_type: 'authorization_code',
      code: 'test-code',
      redirect_uri: 'http://localhost:3000/callback',
      code_verifier: 'test-verifier',
      client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      client_assertion: 'mock-assertion'
    });

    const res = await app.request('/api/token', {
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
