import { expect, test, describe, beforeEach, spyOn } from 'bun:test'
import app from '../../../src/index'
import { JoseCryptoService } from '../../../src/infra/adapters/jose_crypto'
import * as jose from 'jose'

describe('PAR Security Validation', () => {
  let validJwt: string;

  beforeEach(async () => {
    const secret = new TextEncoder().encode('secret');
    validJwt = await new jose.SignJWT({ jti: crypto.randomUUID() })
      .setProtectedHeader({ alg: 'HS256' })
      .sign(secret);
  });

  test('POST /api/par should reject request with missing PKCE challenge', async () => {
    const params = new URLSearchParams({
      client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      client_assertion: validJwt,
      client_id: 'mock-client-id',
      response_type: 'code',
      scope: 'openid',
      redirect_uri: 'https://client.example.com/cb',
      state: 'a'.repeat(30),
      nonce: 'b'.repeat(30),
      // missing code_challenge
      code_challenge_method: 'S256',
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
    expect(body.error).toBe('invalid_request');
  });

  test('POST /api/par should reject request with invalid code_challenge_method', async () => {
    const params = new URLSearchParams({
      client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      client_assertion: validJwt,
      client_id: 'mock-client-id',
      response_type: 'code',
      scope: 'openid',
      redirect_uri: 'https://client.example.com/cb',
      state: 'a'.repeat(30),
      nonce: 'b'.repeat(30),
      code_challenge: 'test-challenge',
      code_challenge_method: 'plain', // FAPI 2.0 requires S256
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
    expect(body.error).toBe('invalid_request');
  });

  test('POST /api/par should reject request with scope missing openid', async () => {
    const params = new URLSearchParams({
      client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      client_assertion: validJwt,
      client_id: 'mock-client-id',
      response_type: 'code',
      scope: 'profile email', // missing openid
      redirect_uri: 'https://client.example.com/cb',
      state: 'a'.repeat(30),
      nonce: 'b'.repeat(30),
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

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('invalid_request');
    expect(body.error_description).toContain('openid');
  });
});
