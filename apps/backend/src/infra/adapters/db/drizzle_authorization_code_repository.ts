import { eq, and, gt } from 'drizzle-orm';
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
      nonce: code.nonce,
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
          eq(schema.authorizationCodes.used, false),
          gt(schema.authorizationCodes.expiresAt, now)
        )
      );

    if (!result) return null;

    return {
      code: result.code,
      userId: result.userId,
      clientId: result.clientId,
      codeChallenge: result.codeChallenge,
      dpopJkt: result.dpopJkt,
      nonce: result.nonce,
      redirectUri: result.redirectUri,
      expiresAt: result.expiresAt,
      used: result.used,
      createdAt: result.createdAt!,
    };
  }

  async markAsUsed(code: string): Promise<void> {
    await db.update(schema.authorizationCodes)
      .set({ used: true })
      .where(eq(schema.authorizationCodes.code, code));
  }
}
