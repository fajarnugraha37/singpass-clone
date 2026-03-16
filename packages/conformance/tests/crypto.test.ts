import { describe, it, expect, spyOn } from "bun:test";
import { generatePkce, decodeJwt, validateIdToken } from "../src/utils/crypto.ts";
import * as jose from "jose";

describe("Crypto Utils", () => {
  it("should generate valid PKCE challenge and verifier", async () => {
    const { verifier, challenge } = await generatePkce();
    expect(verifier).toBeDefined();
    expect(challenge).toBeDefined();
  });

  it("should decode JWT payload correctly", async () => {
    const payload = { sub: "123", name: "John" };
    const secret = new TextEncoder().encode("a-very-long-secret-key-that-is-at-least-32-chars-long");
    const token = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .sign(secret);
    
    const decoded = decodeJwt(token);
    expect(decoded.sub).toBe("123");
    expect(decoded.name).toBe("John");
  });

  it("should validate a valid ID Token", async () => {
    const { publicKey, privateKey } = await jose.generateKeyPair('ES256', { extractable: true });
    const jwk = await jose.exportJWK(publicKey);
    jwk.kid = 'key-1';
    jwk.alg = 'ES256';
    jwk.use = 'sig';

    const issuer = 'https://issuer.com';
    const audience = 'client-123';
    const nonce = 'nonce-123';
    
    const token = await new jose.SignJWT({ sub: 'user-1', nonce })
      .setProtectedHeader({ alg: 'ES256', kid: 'key-1' })
      .setIssuer(issuer)
      .setAudience(audience)
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(privateKey);

    const jwksUrl = 'https://issuer.com/jwks-test-1';
    // Mock fetch for createRemoteJWKSet
    const fetchMock = spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      if (url.toString() === jwksUrl) {
        return {
          status: 200,
          ok: true,
          json: async () => ({ keys: [jwk] })
        } as Response;
      }
      return { status: 404 } as Response;
    });

    const validated = await validateIdToken(token, jwksUrl, issuer, audience, nonce);
    expect(validated.sub).toBe('user-1');
    expect(validated.nonce).toBe(nonce);
    
    fetchMock.mockRestore();
  });

  it("should throw if nonce mismatches", async () => {
    const { publicKey, privateKey } = await jose.generateKeyPair('ES256', { extractable: true });
    const jwk = await jose.exportJWK(publicKey);
    jwk.kid = 'key-1';
    jwk.alg = 'ES256';
    jwk.use = 'sig';

    const token = await new jose.SignJWT({ sub: 'user-1', nonce: 'wrong-nonce' })
      .setProtectedHeader({ alg: 'ES256', kid: 'key-1' })
      .setIssuer('https://issuer.com')
      .setAudience('client-123')
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(privateKey);

    const jwksUrl = 'https://issuer.com/jwks-test-2';
    spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      if (url.toString() === jwksUrl) {
        return { 
          status: 200, 
          ok: true, 
          json: async () => ({ keys: [jwk] }) 
        } as Response;
      }
      return { status: 404 } as Response;
    });

    await expect(validateIdToken(token, jwksUrl, 'https://issuer.com', 'client-123', 'correct-nonce'))
      .rejects.toThrow('Nonce mismatch');
  });
});
