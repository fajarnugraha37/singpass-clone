import { expect, test, describe, beforeAll, beforeEach } from "bun:test";
import { DrizzleAuthDataService } from "../../../src/infra/adapters/drizzle_auth_data";
import { db } from "../../../src/infra/database/client";
import * as schema from "../../../src/infra/database/schema";

describe("DrizzleAuthDataService - Auth Data Lifecycle", () => {
  let authDataService: DrizzleAuthDataService;

  beforeAll(async () => {
    authDataService = new DrizzleAuthDataService();
  });

  beforeEach(async () => {
    // Order of deletion to respect foreign keys
    await db.delete(schema.authorizationCodes);
    await db.delete(schema.sessions);
    await db.delete(schema.parRequests);
    await db.delete(schema.myinfoProfiles);
    await db.delete(schema.users);
  });

  test("should create and retrieve a session", async () => {
    // Create user first due to FK constraint
    await db.insert(schema.users).values({
      id: "user-1",
      name: "Test User",
      nric: "S1234567A",
      email: "test@example.com"
    });

    const { sessionId } = await authDataService.createSession("user-1", "jkt-1");
    expect(sessionId).toBeDefined();

    const session = await authDataService.getSession(sessionId);
    expect(session).toBeDefined();
    expect(session?.userId).toBe("user-1");
    expect(session?.dpopJkt).toBe("jkt-1");
  });

  test("should update session LOA and AMR", async () => {
    const { sessionId } = await authDataService.createSession();
    
    await authDataService.updateSession(sessionId, {
      loa: 2,
      amr: ["pwd", "otp-sms"],
      isAuthenticated: true
    });

    const session = await authDataService.getSession(sessionId);
    expect(session?.loa).toBe(2);
    expect(session?.amr).toEqual(["pwd", "otp-sms"]);
    expect(session?.isAuthenticated).toBe(true);
  });

  test("should issue and exchange an auth code", async () => {
    // 1. Create a user
    await db.insert(schema.users).values({
      id: "user-1",
      name: "Test User",
      nric: "S1234567A",
      email: "test@example.com"
    });

    // 2. Create a PAR (needed for auth code FK)
    const [par] = await db.insert(schema.parRequests).values({
      requestUri: "urn:test:123",
      clientId: "client-1",
      payload: { scope: "openid", redirect_uri: "https://localhost/cb" },
      expiresAt: new Date(Date.now() + 300000)
    }).returning();

    // 3. Create a session
    const { sessionId } = await authDataService.createSession("user-1", "jkt-1");
    await authDataService.updateSession(sessionId, { 
      loa: 1, 
      amr: ["pwd"],
      isAuthenticated: true
    });

    // 4. Issue auth code
    const { code } = await authDataService.issueAuthCode(sessionId, par.id, "challenge", "jkt-1");
    expect(code).toBeDefined();

    // 5. Exchange auth code
    const data = await authDataService.exchangeAuthCode(code);
    expect(data).toBeDefined();
    // expect(data?.sessionId).toBe(sessionId); // No longer stored in new schema
    expect(data?.userId).toBe("user-1");
    expect(data?.dpopJkt).toBe("jkt-1");
    expect(data?.amr).toEqual(["pwd"]);

    // 6. Code should be one-time use (deleted)
    const secondExchange = await authDataService.exchangeAuthCode(code);
    expect(secondExchange).toBeNull();
  });

  test("should return null for non-existent session", async () => {
    const session = await authDataService.getSession("non-existent");
    expect(session).toBeNull();
  });

  test("should throw error when issuing auth code for non-existent session", async () => {
    try {
      await authDataService.issueAuthCode("non-existent", 1, "challenge", "jkt");
      expect(true).toBe(false);
    } catch (e: any) {
      expect(e.message).toBe("Session not found");
    }
  });

  test("should return null when exchanging non-existent or expired code", async () => {
    const data = await authDataService.exchangeAuthCode("invalid-code");
    expect(data).toBeNull();
  });

  test("should invalidate session", async () => {
    const { sessionId } = await authDataService.createSession();
    await authDataService.invalidateSession(sessionId);
    
    const session = await authDataService.getSession(sessionId);
    expect(session).toBeNull();
  });
});
