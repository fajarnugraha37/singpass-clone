import { expect, test, describe, beforeAll, afterAll } from "bun:test";
import { DrizzleAuthDataService } from "../../../src/infra/adapters/drizzle_auth_data";
import { db } from "../../../src/infra/database/client";
import { parRequests } from "../../../src/infra/database/schema";
import { sql } from "drizzle-orm";

describe("DrizzleAuthDataService - PAR Lifecycle", () => {
  let authDataService: DrizzleAuthDataService;

  beforeAll(async () => {
    authDataService = new DrizzleAuthDataService();
    // Clean up par_requests before tests
    await db.delete(parRequests);
  });

  const validPARPayload = {
    response_type: 'code',
    client_id: 'mock-client-id',
    redirect_uri: 'http://localhost:3000/callback',
    scope: 'openid profile',
    state: 'a'.repeat(30),
    nonce: 'b'.repeat(30),
    code_challenge: 'challenge',
    code_challenge_method: 'S256',
    purpose: 'testing',
    client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
    client_assertion: 'eyJhbGci...',
  };

  test("should create a PAR and generate a sequential request_uri", async () => {
    const result = await authDataService.createPAR(validPARPayload);
    
    expect(result.request_uri).toMatch(/^urn:ietf:params:oauth:request_uri:\d+$/);
    expect(result.expires_in).toBe(60);

    const retrieved = await authDataService.getPAR(result.request_uri);
    expect(retrieved).toBeDefined();
    expect(retrieved.client_id).toBe('mock-client-id');
  });

  test("should enforce TTL for PAR retrieval", async () => {
    // Manually insert an expired PAR
    const [inserted] = await db.insert(parRequests).values({
      requestUri: 'urn:ietf:params:oauth:request_uri:expired',
      clientId: validPARPayload.client_id,
      payload: validPARPayload,
      expiresAt: new Date(Date.now() - 1000), // Expired 1s ago
    }).returning();

    const retrieved = await authDataService.getPAR('urn:ietf:params:oauth:request_uri:expired');
    expect(retrieved).toBeNull();
  });

  test("should reject invalid PAR payload (missing openid scope)", async () => {
    const invalidPayload = { ...validPARPayload, scope: 'profile' };
    
    try {
      await authDataService.createPAR(invalidPayload);
      expect(true).toBe(false); // Should not reach here
    } catch (error: any) {
      // ZodError issues are stored in .issues or .errors
      const issues = error.issues || error.errors;
      expect(issues).toBeDefined();
      expect(issues[0].message).toBe('scope must include openid');
    }
  });
});
