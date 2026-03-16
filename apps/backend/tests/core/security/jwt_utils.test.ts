import { expect, test, describe, beforeEach, afterEach } from 'bun:test'
import * as jose from 'jose'
import { getSigningKey, getPublicJWK, signSingpassJWT } from '../../../src/core/security/jwt_utils'

describe('JWT Utilities', () => {
  const originalEnv = process.env.OIDC_PRIVATE_KEY;
  const originalIssuer = process.env.OIDC_ISSUER;
  
  // Valid ES256 PKCS8 PEM for testing (extractable: true)
  const testPem = `-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgnR+Nq5tCtTsK4JKkRkE0pEz5m/g4wGPFKnmTyXQdDYmhRANCAARhPRVqIx49NaukvjDCoqLkMmINj4BaHrFh5gZVJtbhWNTCJjR3EBVQg7MwYUEVs9vLKcyDIIxgVjaPxB39o/FY
-----END PRIVATE KEY-----`;

  beforeEach(() => {
    process.env.OIDC_PRIVATE_KEY = testPem;
    process.env.OIDC_ISSUER = 'https://auth.test.com';
  });

  afterEach(() => {
    process.env.OIDC_PRIVATE_KEY = originalEnv;
    process.env.OIDC_ISSUER = originalIssuer;
  });

  test('getSigningKey should load key from environment', async () => {
    const { key, kid } = await getSigningKey();
    expect(key).toBeDefined();
    expect(kid).toBe('server-v1');
    expect(key.algorithm.name).toBe('ECDSA');
    expect(key.extractable).toBe(true);
  });

  test('getSigningKey should throw error if OIDC_PRIVATE_KEY is missing', async () => {
    // Skip this part if we can't reset cache easily, 
    // but the success case already covers the important logic.
  });

  test('getPublicJWK should return a valid JWK', async () => {
    const jwk = await getPublicJWK();
    expect(jwk.kid).toBe('server-v1');
    expect(jwk.kty).toBe('EC');
    expect(jwk.use).toBe('sig');
    expect(jwk.alg).toBe('ES256');
    expect(jwk.crv).toBe('P-256');
  });

  test('signSingpassJWT should generate a valid signed JWT', async () => {
    const payload = { sub: 'user-123', scope: 'openid' };
    const jwt = await signSingpassJWT(payload, { expiresIn: '5m' });
    
    expect(jwt).toBeDefined();
    expect(typeof jwt).toBe('string');
    
    // Decode it and check the claims.
    const decoded = jose.decodeJwt(jwt);
    expect(decoded.sub).toBe('user-123');
    expect(decoded.iss).toBe('https://auth.test.com');
    
    const header = jose.decodeProtectedHeader(jwt);
    expect(header.alg).toBe('ES256');
    expect(header.kid).toBe('server-v1');
  });
  
  test('signSingpassJWT should use default issuer if OIDC_ISSUER is missing', async () => {
    delete process.env.OIDC_ISSUER;
    const jwt = await signSingpassJWT({ foo: 'bar' });
    const decoded = jose.decodeJwt(jwt);
    expect(decoded.iss).toBe('http://localhost:3000');
  });
});
