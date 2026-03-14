import { db } from '../../database/client';
import * as schema from '../../database/schema';
import { and, eq } from 'drizzle-orm';
import type { JtiStore } from '../../../core/utils/dpop_validator';

export class DrizzleJtiStore implements JtiStore {
  async isUsed(jti: string, clientId: string): Promise<boolean> {
    const [result] = await db.select()
      .from(schema.usedJtis)
      .where(and(
        eq(schema.usedJtis.jti, jti),
        eq(schema.usedJtis.clientId, clientId)
      ))
      .limit(1);
    
    return !!result;
  }

  async markUsed(jti: string, clientId: string, expiresAt: Date): Promise<void> {
    await db.insert(schema.usedJtis).values({
      jti,
      clientId,
      expiresAt,
    }).onConflictDoUpdate({
      target: schema.usedJtis.jti,
      set: { expiresAt }
    });
  }
}
