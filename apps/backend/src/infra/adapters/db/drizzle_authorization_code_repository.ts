import { eq, and, gt, isNull } from 'drizzle-orm';
import { db } from '../../database/client';
import * as schema from '../../database/schema';
import type { AuthorizationCode, AuthorizationCodeRepository } from '../../../core/domain/authorizationCode';

export class DrizzleAuthorizationCodeRepository implements AuthorizationCodeRepository {
  async save(code: AuthorizationCode): Promise<void> {
    await db.insert(schema.authorizationCodes).values({
      code: code.code,
      userId: code.userId,
      clientId: code.clientId,
      codeChallenge: code.codeChallenge,
      dpopJkt: code.dpopJkt,
      scope: code.scope,
      nonce: code.nonce,
      loa: code.loa,
      amr: JSON.stringify(code.amr),
      redirectUri: code.redirectUri,
      expiresAt: code.expiresAt,
      used: code.used,
      createdAt: code.createdAt,
    });
  }

  async getByCode(code: string): Promise<AuthorizationCode | null> {
    const now = new Date();
    const [result] = await db.select()
      .from(schema.authorizationCodes)
      .where(
        and(
          eq(schema.authorizationCodes.code, code),
          isNull(schema.authorizationCodes.usedAt),
          gt(schema.authorizationCodes.expiresAt, now)
        )
      );

    if (!result) return null;

    return {
      ...result,
      amr: result.amr ? JSON.parse(result.amr) : [],
      createdAt: result.createdAt!,
      used: !!result.usedAt,
    } as AuthorizationCode;
  }

  async markAsUsed(code: string): Promise<void> {
    const now = new Date();
    const result = await db.update(schema.authorizationCodes)
      .set({ usedAt: now, used: true })
      .where(
        and(
          eq(schema.authorizationCodes.code, code),
          isNull(schema.authorizationCodes.usedAt)
        )
      );
    
    // In Drizzle, result for SQLite might not return row count directly in all drivers,
    // but the where clause ensures atomicity.
  }
}
