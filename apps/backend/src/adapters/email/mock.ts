import { db } from '../../infra/database/client';
import { emailLog } from '../../infra/database/schema';

export interface EmailOptions {
  to: string;
  subject: string;
  body: string;
}

export interface EmailAdapter {
  send(options: EmailOptions): Promise<void>;
}

export class MockEmailAdapter implements EmailAdapter {
  async send(options: EmailOptions): Promise<void> {
    const { to, subject, body } = options;

    console.log('--- [MOCK EMAIL SENT] ---');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${body}`);
    console.log('--------------------------');

    // Audit to database
    try {
      await db.insert(emailLog).values({
        recipient: to,
        subject,
        body,
      });
    } catch (error) {
      console.error('[MockEmailAdapter] Failed to audit email to database:', error);
    }
  }
}

export const emailAdapter: EmailAdapter = new MockEmailAdapter();
