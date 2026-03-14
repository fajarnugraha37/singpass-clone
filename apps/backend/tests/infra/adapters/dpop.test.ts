import { expect, test, describe, beforeAll } from "bun:test";
import { JoseCryptoService } from "../../../src/infra/adapters/jose_crypto";
import { DrizzleServerKeyManager } from "../../../src/infra/adapters/db/drizzle_key_manager";
import { DrizzleAuthDataService } from "../../../src/infra/adapters/drizzle_auth_data";
import { db } from "../../../src/infra/database/client";
import { securityAuditLog, parRequests, sessions, authCodes, usedJtis } from "../../../src/infra/database/schema";
import * as jose from "jose";

describe("DPoP Binding & Validation (US4)", () => {
  let cryptoService: JoseCryptoService;
  let authDataService: DrizzleAuthDataService;

  beforeAll(async () => {
    process.env.SERVER_KEY_ENCRYPTION_SECRET = "00".repeat(32);
    const keyManager = new DrizzleServerKeyManager();
    cryptoService = new JoseCryptoService(keyManager);
    authDataService = new DrizzleAuthDataService();
    // Clean up
    await db.delete(securityAuditLog);
    await db.delete(authCodes);
    await db.delete(sessions);
    await db.delete(parRequests);
    await db.delete(usedJtis);
  });

  test("should calculate JWK thumbprint", async () => {
    const { publicKey } = await jose.generateKeyPair("ES256");
    const jwk = await jose.exportJWK(publicKey);
    
    const thumbprint = await cryptoService.calculateThumbprint(jwk);
    expect(thumbprint).toBeDefined();
    expect(typeof thumbprint).toBe("string");
  });

  test("should validate a valid DPoP proof", async () => {
    const { publicKey, privateKey } = await jose.generateKeyPair("ES256");
    const jwk = await jose.exportJWK(publicKey);
    
    const proof = await new jose.SignJWT({
      htm: "POST",
      htu: "http://localhost:3000/token",
      jti: crypto.randomUUID(),
    })
      .setProtectedHeader({ alg: "ES256", typ: "dpop+jwt", jwk })
      .setIssuedAt()
      .sign(privateKey);

    const result = await cryptoService.validateDPoPProof(proof, "POST", "http://localhost:3000/token", "mock-client-id");
    expect(result.jkt).toBeDefined();
    
    const expectedJkt = await jose.calculateJwkThumbprint(jwk);
    expect(result.jkt).toBe(expectedJkt);
  });

  test("should reject DPoP proof with mismatched method/url", async () => {
    const { publicKey, privateKey } = await jose.generateKeyPair("ES256");
    const jwk = await jose.exportJWK(publicKey);
    
    const proof = await new jose.SignJWT({
      htm: "POST",
      htu: "http://localhost:3000/token",
      jti: crypto.randomUUID(),
    })
      .setProtectedHeader({ alg: "ES256", typ: "dpop+jwt", jwk })
      .setIssuedAt()
      .sign(privateKey);

    try {
      await cryptoService.validateDPoPProof(proof, "GET", "http://localhost:3000/token", "mock-client-id");
      expect(true).toBe(false);
    } catch (e: any) {
      expect(e.message).toContain("htm mismatch");
    }
  });

  test("should reject reused DPoP JTI (replay attack)", async () => {
    const { publicKey, privateKey } = await jose.generateKeyPair("ES256");
    const jwk = await jose.exportJWK(publicKey);
    const jti = crypto.randomUUID();
    
    const proof = await new jose.SignJWT({
      htm: "POST",
      htu: "http://localhost:3000/token",
      jti,
    })
      .setProtectedHeader({ alg: "ES256", typ: "dpop+jwt", jwk })
      .setIssuedAt()
      .sign(privateKey);

    // 1. First time succeeds (mocking the log entry)
    await db.insert(usedJtis).values({
      jti,
      clientId: "mock-client-id",
      expiresAt: new Date(Date.now() + 60000),
    });

    // 2. Second time should fail
    try {
      await cryptoService.validateDPoPProof(proof, "POST", "http://localhost:3000/token", "mock-client-id");
      expect(true).toBe(false);
    } catch (e: any) {
      expect(e.message).toContain("DPoP jti replay");
    }
  });

  test("should bind DPoP JKT to auth code and session", async () => {
    const jkt = "mock-thumbprint";
    
    // 1. Create PAR
    const { request_uri } = await authDataService.createPAR({
      response_type: 'code',
      client_id: 'mock-client-id',
      redirect_uri: 'http://localhost:3000/callback',
      scope: 'openid',
      state: 'state',
      nonce: 'nonce',
      code_challenge: 'challenge',
      code_challenge_method: 'S256',
      client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      client_assertion: 'jwt',
    });
    
    // 2. Create session with binding
    const { sessionId } = await authDataService.createSession(undefined, jkt);
    const session = await authDataService.getSession(sessionId);
    expect(session?.dpopJkt).toBe(jkt);

    // 3. Issue Auth Code with binding
    const parId = parseInt(request_uri.split(":").pop() || "0");
    const { code } = await authDataService.issueAuthCode(sessionId, parId, "challenge", jkt);
    
    // 4. Exchange and verify binding
    const exchangeData = await authDataService.exchangeAuthCode(code);
    expect(exchangeData?.dpopJkt).toBe(jkt);
    expect(exchangeData?.sessionId).toBe(sessionId);
  });
});
