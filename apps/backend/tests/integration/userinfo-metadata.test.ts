import { expect, test, describe, beforeAll, spyOn, afterEach, mock } from 'bun:test';
import app from '../../src/index';
import * as jose from 'jose';
import { JoseCryptoService } from '../../src/infra/adapters/jose_crypto';
import { DrizzleUserInfoRepository } from '../../src/infra/adapters/db/drizzle_userinfo_repository';
import { DrizzleClientRegistry } from '../../src/infra/adapters/client_registry';
import { createEmptyMyinfoPerson } from '../../src/core/domain/myinfo-person';

describe('UserInfo Metadata Integration', () => {
  let clientKeyPair: jose.GenerateKeyPairResult;
  let clientEncKeyPair: jose.GenerateKeyPairResult;

  beforeAll(async () => {
    clientKeyPair = await jose.generateKeyPair('ES256');
    clientEncKeyPair = await jose.generateKeyPair('ECDH-ES+A256KW');
  });

  afterEach(() => {
    mock.restore();
  });

  test('UserInfo response should include metadata for all attributes', async () => {
    const clientJwk = await jose.exportJWK(clientKeyPair.publicKey);
    const clientJkt = await jose.calculateJwkThumbprint(clientJwk);
    const clientEncJwk = await jose.exportJWK(clientEncKeyPair.publicKey);
    clientEncJwk.kid = 'client-enc-key';
    clientEncJwk.use = 'enc';
    clientEncJwk.alg = 'ECDH-ES+A256KW';

    // Mocks
    spyOn(DrizzleUserInfoRepository.prototype, 'getAccessToken').mockImplementation(async () => ({
      token: 'valid-token',
      userId: 'user-123',
      clientId: 'test-client',
      dpopJkt: clientJkt,
      scope: 'openid uinfin name',
      expiresAt: new Date(Date.now() + 3600000),
      revoked: false,
      amr: ['pwd'],
      loa: 2,
    }));

    spyOn(DrizzleUserInfoRepository.prototype, 'getMyinfoProfile').mockImplementation(async () => {
      const person = createEmptyMyinfoPerson('user-123');
      person.uinfin = { value: 'S1234567A', source: '1', classification: 'C', lastupdated: '2024-03-18' };
      person.name = { value: 'JOHN DOE', source: '1', classification: 'C', lastupdated: '2024-03-18' };
      return person;
    });

    spyOn(DrizzleUserInfoRepository.prototype, 'getUserById').mockImplementation(async () => ({
      id: 'user-123',
      nric: 'S1234567A',
      name: 'JOHN DOE',
      email: 'john@example.com',
      mobileno: '91234567',
    }));

    spyOn(DrizzleClientRegistry.prototype, 'getClientConfig').mockImplementation(async () => ({
      clientId: 'test-client',
      clientName: 'Test Client',
      jwks: { keys: [clientEncJwk] },
    }));

    spyOn(JoseCryptoService.prototype, 'validateDPoPNonce').mockImplementation(async () => true);

    const dpopProof = await new jose.SignJWT({
      htm: 'GET',
      htu: 'http://localhost/userinfo',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 120,
      jti: crypto.randomUUID(),
      nonce: 'nonce',
    })
      .setProtectedHeader({ alg: 'ES256', typ: 'dpop+jwt', jwk: clientJwk })
      .sign(clientKeyPair.privateKey);

    const res = await app.request('/userinfo', {
      headers: {
        'Authorization': 'DPoP valid-token',
        'DPoP': dpopProof,
      }
    });

    expect(res.status).toBe(200);
    const jwe = await res.text();
    
    // Decrypt JWE
    const { plaintext } = await jose.compactDecrypt(jwe, clientEncKeyPair.privateKey);
    const jws = new TextDecoder().decode(plaintext);
    
    // Verify JWS (Skip signature verification for brevity here as we trust the server mock)
    const payload = JSON.parse(new TextDecoder().decode(jose.base64url.decode(jws.split('.')[1])));
    
    expect(payload).toHaveProperty('person_info');
    const pi = payload.person_info;
    
    expect(pi.uinfin).toEqual({
      value: 'S1234567A',
      source: '1',
      classification: 'C',
      lastupdated: '2024-03-18'
    });
    expect(pi.name).toEqual({
      value: 'JOHN DOE',
      source: '1',
      classification: 'C',
      lastupdated: '2024-03-18'
    });
  });
});
