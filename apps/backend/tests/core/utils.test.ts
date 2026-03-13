import { expect, test, describe } from 'bun:test';
import { validateDPoPProof } from '../../src/core/utils/dpop';
import { validatePKCE } from '../../src/core/utils/pkce';
import * as jose from 'jose';

describe('Core Utilities', () => {
  describe('DPoP Validation', () => {
    test('should validate a correct DPoP proof', async () => {
      const keyPair = await jose.generateKeyPair('ES256');
      const jwk = await jose.exportJWK(keyPair.publicKey);
      
      const jwt = await new jose.SignJWT({
        htm: 'POST',
        htu: 'https://server.example.com/token',
        jti: 'test-jti',
      })
        .setProtectedHeader({ alg: 'ES256', typ: 'dpop+jwt', jwk })
        .setIssuedAt()
        .sign(keyPair.privateKey);

      const result = await validateDPoPProof({
        header: jwt,
        method: 'POST',
        url: 'https://server.example.com/token',
      });

      expect(result.isValid).toBe(true);
      expect(result.jkt).toBeDefined();
    });

    test('should fail if htm mismatch', async () => {
      const keyPair = await jose.generateKeyPair('ES256');
      const jwk = await jose.exportJWK(keyPair.publicKey);
      
      const jwt = await new jose.SignJWT({
        htm: 'GET',
        htu: 'https://server.example.com/token',
        jti: 'test-jti',
      })
        .setProtectedHeader({ alg: 'ES256', typ: 'dpop+jwt', jwk })
        .setIssuedAt()
        .sign(keyPair.privateKey);

      const result = await validateDPoPProof({
        header: jwt,
        method: 'POST',
        url: 'https://server.example.com/token',
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('invalid_htm');
    });

    test('should fail if jwk thumbprint mismatch', async () => {
      const keyPair = await jose.generateKeyPair('ES256');
      const jwk = await jose.exportJWK(keyPair.publicKey);
      
      const jwt = await new jose.SignJWT({
        htm: 'POST',
        htu: 'https://server.example.com/token',
        jti: 'test-jti',
      })
        .setProtectedHeader({ alg: 'ES256', typ: 'dpop+jwt', jwk })
        .setIssuedAt()
        .sign(keyPair.privateKey);

      const result = await validateDPoPProof({
        header: jwt,
        method: 'POST',
        url: 'https://server.example.com/token',
        expectedJkt: 'wrong-jkt',
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('invalid_jkt');
    });
  });

  describe('PKCE Validation', () => {
    test('should validate a correct S256 PKCE verifier', async () => {
      // Verifier: base64url(random bytes) from RFC 7636
      const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
      // Challenge: base64url(sha256(verifier))
      const challenge = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM';

      const isValid = await validatePKCE(verifier, challenge, 'S256');
      expect(isValid).toBe(true);
    });

    test('should fail for incorrect verifier', async () => {
      const verifier = 'wrong-verifier';
      const challenge = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM';

      const isValid = await validatePKCE(verifier, challenge, 'S256');
      expect(isValid).toBe(false);
    });

    test('should fail for unsupported method', async () => {
      const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJ1p1r_GXVv2CtLUXXPk';
      const challenge = 'dBjftJeZ4CVP-mB92K27uhbUJ1p1r_GXVv2CtLUXXPk'; // plain

      const isValid = await validatePKCE(verifier, challenge, 'plain');
      expect(isValid).toBe(false);
    });
  });
});
