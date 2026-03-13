import { expect, test, describe, beforeAll } from 'bun:test';
import app from '../../src/index';
import * as jose from 'jose';

describe('Token Exchange Integration', () => {
  let clientKeyPair: jose.GenerateKeyPairResult;
  let serverKeyPair: jose.GenerateKeyPairResult;

  beforeAll(async () => {
    clientKeyPair = await jose.generateKeyPair('ES256');
    serverKeyPair = await jose.generateKeyPair('ES256');
  });

  test('POST /token should exchange auth code for tokens', async () => {
    // 1. Generate DPoP proof
    const dpopProof = await new jose.SignJWT({
      htm: 'POST',
      htu: 'http://localhost/token',
      jti: crypto.randomUUID(),
    })
      .setProtectedHeader({ 
        alg: 'ES256', 
        typ: 'dpop+jwt', 
        jwk: await jose.exportJWK(clientKeyPair.publicKey) 
      })
      .setIssuedAt()
      .sign(clientKeyPair.privateKey);

    // 2. Generate Client Assertion (private_key_jwt)
    const clientAssertion = await new jose.SignJWT({
      iss: 'test-client',
      sub: 'test-client',
      aud: 'http://localhost/token',
      jti: crypto.randomUUID(),
    })
      .setProtectedHeader({ alg: 'ES256', kid: 'test-client-key' })
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(clientKeyPair.privateKey);

    // 3. Prepare request body
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code: 'valid-code-123',
      redirect_uri: 'http://localhost:3000/cb',
      code_verifier: 'test-verifier-abc',
      client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      client_assertion: clientAssertion,
    });

    // 4. Send request
    const res = await app.request('/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'DPoP': dpopProof,
      },
      body: body.toString(),
    });

    // EXPECTATION: This will FAIL (404) until the endpoint is implemented.
    // For TDD, we want to see it fail.
    expect(res.status).toBe(200);
    
    const data = await res.json();
    expect(data.access_token).toBeDefined();
    expect(data.id_token).toBeDefined();
    expect(data.token_type).toBe('DPoP');
  });

  test('POST /token should return 400 for missing DPoP header', async () => {
    const res = await app.request('/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: 'valid-code',
      }).toString(),
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('invalid_dpop_proof');
  });
});
