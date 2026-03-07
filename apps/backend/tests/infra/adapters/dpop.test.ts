import { expect, test, describe, beforeAll } from "bun:test";
import { JoseCryptoService } from "../../../src/infra/adapters/jose_crypto";
import { DrizzleAuthDataService } from "../../../src/infra/adapters/drizzle_auth_data";
import { db } from "../../../src/infra/database/client";
import { securityAuditLog, parRequests, sessions, authCodes } from "../../../src/infra/database/schema";
import * as jose from "jose";

describe("DPoP Binding & Validation (US4)", () => {
  let cryptoService: JoseCryptoService;
  let authDataService: DrizzleAuthDataService;

  beforeAll(async () => {
    cryptoService = new JoseCryptoService();
    authDataService = new DrizzleAuthDataService();
    // Clean up
    await db.delete(securityAuditLog);
    await db.delete(authCodes);
    await db.delete(sessions);
    await db.delete(parRequests);
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

    const result = await cryptoService.validateDPoPProof(proof, "POST", "http://localhost:3000/token");
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
      await cryptoService.validateDPoPProof(proof, "GET", "http://localhost:3000/token");
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
    await db.insert(securityAuditLog).values({
      eventType: "DPOP_VALIDATION_SUCCESS",
      severity: "INFO",
      details: { jti },
    });

    // 2. Second time should fail
    try {
      await cryptoService.validateDPoPProof(proof, "POST", "http://localhost:3000/token");
      expect(true).toBe(false);
    } catch (e: any) {
      expect(e.message).toContain("jti already used");
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
