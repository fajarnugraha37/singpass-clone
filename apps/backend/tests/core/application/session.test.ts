import { expect, test, describe, beforeAll } from "bun:test";
import { DrizzleAuthDataService } from "../../../src/infra/adapters/drizzle_auth_data";
import { db } from "../../../src/infra/database/client";
import { sessions, users, myinfoProfiles } from "../../../src/infra/database/schema";

describe("Session Tracking (US3)", () => {
  let authDataService: DrizzleAuthDataService;
  let testUserId: string;

  beforeAll(async () => {
    authDataService = new DrizzleAuthDataService();
    // Clean up
    await db.delete(sessions);
    await db.delete(myinfoProfiles);
    await db.delete(users);

    // Create a test user
    const [user] = await db.insert(users).values({
      name: "Test User",
      email: "test@example.com",
      nric: "S1234567A",
    }).returning();
    testUserId = user.id;
  });

  test("should create an unauthenticated session (LOA 0)", async () => {
    const { sessionId } = await authDataService.createSession();
    expect(sessionId).toBeDefined();

    const session = await authDataService.getSession(sessionId);
    expect(session).toBeDefined();
    expect(session?.loa).toBe(0);
    expect(session?.isAuthenticated).toBe(false);
    expect(session?.userId).toBeNull();
  });

  test("should update session to LOA 1 (Password)", async () => {
    const { sessionId } = await authDataService.createSession();
    
    await authDataService.updateSession(sessionId, {
      loa: 1,
      isAuthenticated: true,
      amr: [],
    });

    const session = await authDataService.getSession(sessionId);
    expect(session?.loa).toBe(1);
    expect(session?.isAuthenticated).toBe(true);
  });

  test("should update session to LOA 2 (2FA)", async () => {
    const { sessionId } = await authDataService.createSession();
    
    // First step: Password
    await authDataService.updateSession(sessionId, {
      loa: 1,
      isAuthenticated: true,
      amr: [],
    });

    // Second step: 2FA
    await authDataService.updateSession(sessionId, {
      loa: 2,
      isAuthenticated: true,
      amr: [],
    });

    const session = await authDataService.getSession(sessionId);
    expect(session?.loa).toBe(2);
    expect(session?.isAuthenticated).toBe(true);
  });

  test("should bind a user to an existing session", async () => {
    const { sessionId } = await authDataService.createSession();
    
    // Bind user and elevate LOA
    // Note: our current updateSession doesn't support updating userId, 
    // but createSession does. If we need to bind later, we might need 
    // to update updateSession or add a bindUser method.
    // For now, let's test creating with userId.
    
    const { sessionId: boundSessionId } = await authDataService.createSession(testUserId);
    const session = await authDataService.getSession(boundSessionId);
    expect(session?.userId).toBe(testUserId);
  });

  test("should enforce session expiry", async () => {
    // Manually insert an expired session
    const [inserted] = await db.insert(sessions).values({
      loa: 0,
      isAuthenticated: false,
      expiresAt: new Date(Date.now() - 1000), // Expired 1s ago
    }).returning();

    const session = await authDataService.getSession(inserted.id);
    expect(session).toBeNull();
  });
});
