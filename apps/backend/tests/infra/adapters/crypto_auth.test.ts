import { expect, test, describe, beforeAll } from "bun:test";
import { JoseCryptoService } from "../../../src/infra/adapters/jose_crypto";
import { DrizzleServerKeyManager } from "../../../src/infra/adapters/db/drizzle_key_manager";
import * as jose from "jose";

describe("JoseCryptoService - Client Authentication", () => {
  let cryptoService: JoseCryptoService;
  const mockSecret = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"; // 32-byte hex

  beforeAll(() => {
    process.env.SERVER_KEY_ENCRYPTION_SECRET = mockSecret;
    const keyManager = new DrizzleServerKeyManager();
    cryptoService = new JoseCryptoService(keyManager);
  });

  test("should validate a valid private_key_jwt client assertion", async () => {
    // 1. Create a mock client key pair
    const { publicKey, privateKey } = await jose.generateKeyPair("ES256");
    const clientPublicKeyJWK = await jose.exportJWK(publicKey);
    
    // 2. Create a signed assertion
    const assertion = await new jose.SignJWT({
      iss: "mock-client-id",
      sub: "mock-client-id",
      aud: "http://localhost:3000/par",
    })
      .setProtectedHeader({ alg: "ES256" })
      .setIssuedAt()
      .setExpirationTime("5m")
      .setJti(crypto.randomUUID())
      .sign(privateKey);

    // 3. Validate
    const isValid = await cryptoService.validateClientAssertion(assertion, clientPublicKeyJWK);
    expect(isValid).toBe(true);
  });

  test("should reject an assertion signed with a different key", async () => {
    const { publicKey } = await jose.generateKeyPair("ES256");
    const clientPublicKeyJWK = await jose.exportJWK(publicKey);

    const otherKeyPair = await jose.generateKeyPair("ES256");
    
    const assertion = await new jose.SignJWT({ iss: "test" })
      .setProtectedHeader({ alg: "ES256" })
      .sign(otherKeyPair.privateKey);

    const isValid = await cryptoService.validateClientAssertion(assertion, clientPublicKeyJWK);
    expect(isValid).toBe(false);
  });

  test("should reject an expired assertion", async () => {
    const { publicKey, privateKey } = await jose.generateKeyPair("ES256");
    const clientPublicKeyJWK = await jose.exportJWK(publicKey);
    
    const assertion = await new jose.SignJWT({ iss: "test" })
      .setProtectedHeader({ alg: "ES256" })
      .setIssuedAt(Math.floor(Date.now() / 1000) - 3600)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 1800)
      .sign(privateKey);

    const isValid = await cryptoService.validateClientAssertion(assertion, clientPublicKeyJWK);
    expect(isValid).toBe(false);
  });
});
