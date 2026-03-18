import { expect, test, describe, beforeEach, spyOn, afterEach, mock, vi, type Mock } from 'bun:test'
import { TokenExchangeUseCase } from '../../../src/core/use-cases/token-exchange';
import { FapiErrors } from '../../../src/infra/middleware/fapi-error';

import app from '../../../src/index'
import { DPoPValidator } from '../../../src/core/utils/dpop_validator'
import { ClientAuthenticationService } from '../../../src/core/application/services/client-auth.service'

describe('Token Endpoint DPoP Integration', () => {

  beforeEach(async () => {
    spyOn(ClientAuthenticationService.prototype, 'authenticate').mockImplementation(async () => ({ clientId: 'mock-client-id' }));
  });

  afterEach(() => {
    mock.restore();
  });

  test('should fail if DPoP validation returns invalid_htu', async () => {
    spyOn(TokenExchangeUseCase.prototype, "execute").mockRejectedValueOnce(FapiErrors.invalidDpopProof('Invalid DPoP HTU'));
    spyOn(DPoPValidator.prototype, 'validate').mockImplementation(async () => ({
      isValid: false,
      jkt: '',
      error: 'invalid_htu'
    }));

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code: 'test-code',
      redirect_uri: 'https://localhost/callback',
      code_verifier: 'test-verifier-that-is-at-least-43-characters-long-and-valid',
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
    expect(body.error_description).toContain('Invalid DPoP HTU');
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
      redirect_uri: 'https://localhost/callback',
      code_verifier: 'test-verifier-that-is-at-least-43-characters-long-and-valid',
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

  describe('PKCE Constraints', () => {
    test('should fail if code_verifier is too short', async () => {
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        code: 'test-code',
        redirect_uri: 'https://localhost/callback',
        code_verifier: 'too-short',
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
      expect(body.error).toBe('invalid_request');
    });

    test('should fail if code_verifier contains invalid characters', async () => {
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        code: 'test-code',
        redirect_uri: 'https://localhost/callback',
        code_verifier: 'invalid-verifier-with-!@#$%^&*()-characters-that-are-not-allowed',
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
      expect(body.error).toBe('invalid_request');
    });

    test('should pass if code_verifier is valid', async () => {
      spyOn(TokenExchangeUseCase.prototype, "execute").mockResolvedValueOnce({
        access_token: 'mock-at',
        token_type: 'DPoP',
        expires_in: 3600
      });

      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        code: 'test-code',
        redirect_uri: 'https://localhost/callback',
        code_verifier: 'valid-verifier-that-is-at-least-43-characters-long-and-uses-safe-chars_~',
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

      expect(res.status).toBe(200);
    });
  });
});
