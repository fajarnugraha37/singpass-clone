import { db } from '../../database/client';
import * as schema from '../../database/schema';
import { eq, and } from 'drizzle-orm';

export interface TokenRecord {
  token: string;
  userId: string;
  clientId: string;
  dpopJkt: string;
  scope: string;
  expiresAt: Date;
}

export class DrizzleTokenRepository {
  /**
   * Persists an access token and its DPoP binding.
   */
  async saveAccessToken(record: TokenRecord): Promise<void> {
    await db.insert(schema.accessTokens).values({
      token: record.token,
      userId: record.userId,
      clientId: record.clientId,
      dpopJkt: record.dpopJkt,
      scope: record.scope,
      expiresAt: record.expiresAt,
    });
  }

  /**
   * Persists a refresh token.
   */
  async saveRefreshToken(record: TokenRecord): Promise<void> {
    await db.insert(schema.refreshTokens).values({
      token: record.token,
      userId: record.userId,
      clientId: record.clientId,
      dpopJkt: record.dpopJkt,
      scope: record.scope,
      expiresAt: record.expiresAt,
    });
  }

  /**
   * Revokes all tokens associated with a specific user/client session.
   */
  async revokeTokensForSession(userId: string, clientId: string): Promise<void> {
    await db.update(schema.accessTokens)
      .set({ revoked: true })
      .where(and(
        eq(schema.accessTokens.userId, userId),
        eq(schema.accessTokens.clientId, clientId)
      ));

    await db.update(schema.refreshTokens)
      .set({ revoked: true })
      .where(and(
        eq(schema.refreshTokens.userId, userId),
        eq(schema.refreshTokens.clientId, clientId)
      ));
  }
}
