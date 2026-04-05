import { describe, it, expect, beforeEach } from 'bun:test';
import { IAMService } from '../../src/core/iam/service';
import { getDb } from '../../src/infra/database/client';
import { developers, otpCodes, clients, sessions } from '../../src/infra/database/schema';
import { eq } from 'drizzle-orm';

describe('IAMService', () => {
  let iamService: IAMService;
  let db: any;

  beforeEach(async () => {
    db = await getDb();
    // Clean up in order to respect foreign keys
    await db.delete(sessions);
    await db.delete(clients);
    await db.delete(otpCodes);
    await db.delete(developers);
    
    // Seed a developer
    await db.insert(developers).values({
      email: 'dev@example.com',
      role: 'developer',
      status: 'active',
    });

    iamService = new IAMService(db);
  });

  it('should generate and store an OTP when requested', async () => {
    await iamService.requestOtp('dev@example.com');
    
    const codes = await db.select().from(otpCodes).where(eq(otpCodes.email, 'dev@example.com'));
    expect(codes.length).toBe(1);
    expect(codes[0].code).toMatch(/^\d{6}$/);
    expect(codes[0].used).toBe(false);
  });

  it('should verify a valid OTP and return a session token', async () => {
    await iamService.requestOtp('dev@example.com');
    const [{ code }] = await db.select().from(otpCodes).where(eq(otpCodes.email, 'dev@example.com'));
    
    const result = await iamService.verifyOtp('dev@example.com', code);
    expect(result.token).toBeDefined();
    expect(result.user.email).toBe('dev@example.com');
    
    // Check it's marked as used
    const [updatedCode] = await db.select().from(otpCodes).where(eq(otpCodes.email, 'dev@example.com'));
    expect(updatedCode.used).toBe(true);
  });

  it('should fail if OTP is incorrect', async () => {
    await iamService.requestOtp('dev@example.com');
    
    expect(iamService.verifyOtp('dev@example.com', '000000')).rejects.toThrow();
  });

  it('should fail if OTP is expired', async () => {
    await iamService.requestOtp('dev@example.com');
    // Manually expire it
    await db.update(otpCodes).set({ expiresAt: new Date(Date.now() - 1000) });
    
    const [{ code }] = await db.select().from(otpCodes).where(eq(otpCodes.email, 'dev@example.com'));
    expect(iamService.verifyOtp('dev@example.com', code)).rejects.toThrow();
  });
});
