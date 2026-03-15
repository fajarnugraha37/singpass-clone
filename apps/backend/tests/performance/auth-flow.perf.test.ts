import { describe, it, expect, beforeAll } from 'bun:test';
import app from '../../src/index';
import { db } from '../../src/infra/database/client';
import * as schema from '../../src/infra/database/schema';
import { eq } from 'drizzle-orm';

describe('Performance Benchmark: Authentication Flow (SC-003)', () => {
  let sessionId: string;
  const testUserId = crypto.randomUUID();

  beforeAll(async () => {
    // Check if test user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(schema.users.nric, 'S1234567A')
    });

    if (!existingUser) {
      // Seed test user with password 'test1234'
      await db.insert(schema.users).values({
        id: testUserId,
        nric: 'S1234567A',
        name: 'Perf Test User',
        email: 'perf@example.com',
        passwordHash: '$2a$10$T1YI7B1aZ1z9U9d.4S.o0eL6L.z/U3.Y7VfG3GjA7W9X9qQ2A.K/O' // test1234
      });
    }

    sessionId = crypto.randomUUID();
    
    // Create a mock PAR request
    const requestUri = `urn:ietf:params:oauth:request_uri:${crypto.randomUUID()}`;
    await db.insert(schema.parRequests).values({
      requestUri,
      clientId: 'test-client-perf',
      payload: { 
        client_id: 'test-client-perf',
        code_challenge: 'mock-challenge',
        redirect_uri: 'https://client.example.com/cb',
        scope: 'openid'
      },
      dpopJkt: 'mock-dpop-jkt',
      expiresAt: new Date(Date.now() + 60000)
    });

    // Create a mock auth session
    await db.insert(schema.authSessions).values({
      id: sessionId,
      parRequestUri: requestUri,
      clientId: 'test-client-perf',
      status: 'INITIATED',
      expiresAt: new Date(Date.now() + 60000)
    });
  });

  it('should complete the auth flow under 1 second', async () => {
    const t0 = performance.now();

    // 1. Password Login
    const loginRes = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': `vibe_auth_session=${sessionId}`
      },
      body: JSON.stringify({
        username: 'S1234567A',
        password: 'password123' // Mock logic in ValidateLogin expects password123 currently
      })
    });
    
    if (loginRes.status !== 200) {
      console.error(await loginRes.text());
    }
    expect(loginRes.status).toBe(200);

    // 2. We need the OTP from the database to complete 2FA
    const session = await db.query.authSessions.findFirst({
      where: eq(schema.authSessions.id, sessionId)
    });
    
    const otp = session?.otpCode;
    expect(otp).toBeDefined();

    // 3. 2FA Validation
    const tfaRes = await app.request('/api/auth/2fa', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': `vibe_auth_session=${sessionId}`
      },
      body: JSON.stringify({
        otp: otp
      })
    });

    if (tfaRes.status !== 200) {
      console.error(await tfaRes.text());
    }
    expect(tfaRes.status).toBe(200);

    const t1 = performance.now();
    const duration = t1 - t0;
    
    console.log(`Auth Flow Duration: ${duration.toFixed(2)}ms`);
    expect(duration).toBeLessThan(1000); // Under 1 second
  });
});
