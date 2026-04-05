import { eq, and, gt } from 'drizzle-orm';
import { developers, otpCodes } from '../../infra/database/schema';
import { signSingpassJWT } from '../../core/security/jwt_utils';
import { emailAdapter } from '../../adapters/email/mock';

export class IAMService {
  constructor(private db: any) {}

  async registerDeveloper(email: string): Promise<any> {
    const existing = await this.db.query.developers.findFirst({
      where: eq(developers.email, email),
    });

    if (existing) {
      throw new Error('Email already registered');
    }

    const [dev] = await this.db.insert(developers).values({
      email,
      role: 'developer',
      status: 'active',
    }).returning();

    return dev;
  }

  async requestOtp(email: string): Promise<void> {
    // 1. Verify developer exists
    const dev = await this.db.query.developers.findFirst({
      where: eq(developers.email, email),
    });

    if (!dev) {
      // For security, don't reveal if developer exists, but we won't send anything
      console.warn(`[IAMService] OTP requested for non-existent email: ${email}`);
      return;
    }

    if (dev.status === 'deactivated') {
      throw new Error('Account is deactivated');
    }

    // 2. Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // 3. Store OTP
    await this.db.insert(otpCodes).values({
      email,
      code,
      expiresAt,
    });

    // 4. Send Email (Mocked)
    await emailAdapter.send({
      to: email,
      subject: 'Your Vibe Management OTP',
      body: `Your one-time password is: ${code}. It expires in 10 minutes.`,
    });
  }

  async verifyOtp(email: string, code: string): Promise<{ token: string; user: any }> {
    // 1. Find valid OTP
    const validOtp = await this.db.query.otpCodes.findFirst({
      where: and(
        eq(otpCodes.email, email),
        eq(otpCodes.code, code),
        eq(otpCodes.used, false),
        gt(otpCodes.expiresAt, new Date())
      ),
    });

    if (!validOtp) {
      throw new Error('Invalid or expired OTP');
    }

    // 2. Mark OTP as used
    await this.db.update(otpCodes).set({ used: true }).where(eq(otpCodes.id, validOtp.id));

    // 3. Get Developer
    const dev = await this.db.query.developers.findFirst({
      where: eq(developers.email, email),
    });

    if (!dev) throw new Error('Developer not found');

    // 4. Generate Session JWT
    const token = await signSingpassJWT({
      sub: dev.id,
      email: dev.email,
      role: dev.role,
    }, { expiresIn: '8h' });

    return { token, user: dev };
  }
}
