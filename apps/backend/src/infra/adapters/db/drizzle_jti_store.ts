import { eq, and } from 'drizzle-orm';
import { db } from '../../database/client';
import { usedJtis } from '../../database/schema';
import { JtiStore } from '../../../core/utils/dpop_validator';

export class DrizzleJtiStore implements JtiStore {
  async isUsed(jti: string, clientId: string): Promise<boolean> {
    const [existing] = await db
      .select()
      .from(usedJtis)
      .where(and(eq(usedJtis.jti, jti), eq(usedJtis.clientId, clientId)))
      .limit(1);

    return !!existing;
  }

  async markUsed(jti: string, clientId: string, expiresAt: Date): Promise<void> {
    await db.insert(usedJtis).values({
      jti,
      clientId,
      expiresAt,
    }).onConflictDoNothing(); // Prevent race conditions
  }
}
