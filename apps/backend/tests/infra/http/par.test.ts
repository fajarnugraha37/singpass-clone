import { expect, test, describe, beforeEach, spyOn } from 'bun:test'
import app from '../../../src/index'
import { JoseCryptoService } from '../../../src/infra/adapters/jose_crypto'
import * as jose from 'jose'

describe('PAR Endpoint', () => {
  let validJwt: string;

  beforeEach(async () => {
    const secret = new TextEncoder().encode('secret');
    validJwt = await new jose.SignJWT({ jti: crypto.randomUUID() })
      .setProtectedHeader({ alg: 'HS256' })
      .sign(secret);
    
    // Bypass real crypto validation for integration test
    spyOn(JoseCryptoService.prototype, 'validateClientAssertion').mockImplementation(async () => true);
    spyOn(JoseCryptoService.prototype, 'validateDPoPProof').mockImplementation(async () => ({ jkt: 'test-jkt' }));
  });

  test('POST /api/par should return 201 Created for valid request', async () => {
    const params = new URLSearchParams({
      client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      client_assertion: validJwt,
      client_id: 'mock-client-id',
      response_type: 'code',
      scope: 'openid',
      redirect_uri: 'https://client.example.com/cb',
      state: 'test-state',
      nonce: 'test-nonce',
      code_challenge: 'test-challenge',
      code_challenge_method: 'S256',
    });

    const res = await app.request('/api/par', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const body = await res.json();
    if (res.status !== 201) {
      console.error('PAR Error Response:', body);
    }
    
    expect(res.status).toBe(201);
    expect(body).toHaveProperty('request_uri');
    expect(body).toHaveProperty('expires_in');
  });

  test('POST /api/par should fail for invalid Zod schema', async () => {
    const params = new URLSearchParams({
      client_id: 'test-client',
      // missing many required fields
    });

    const res = await app.request('/api/par', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty('error', 'invalid_request');
  });
});
