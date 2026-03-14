import { eq, and } from 'drizzle-orm';
import { db } from '../../database/client';
import { users, accessTokens } from '../../database/schema';
import { UserInfoRepository, AccessTokenData } from '../../../core/domain/userinfo_repository';
import { UserData } from '../../../core/domain/userinfo_claims';

export class DrizzleUserInfoRepository implements UserInfoRepository {
  /**
   * Retrieves an access token by its value.
   */
  async getAccessToken(token: string): Promise<AccessTokenData | null> {
    const [result] = await db
      .select()
      .from(accessTokens)
      .where(and(eq(accessTokens.token, token), eq(accessTokens.revoked, false)))
      .limit(1);

    if (!result) return null;

    return {
      token: result.token,
      userId: result.userId,
      clientId: result.clientId,
      dpopJkt: result.dpopJkt,
      scope: result.scope,
      expiresAt: result.expiresAt,
      revoked: result.revoked,
    };
  }

  /**
   * Retrieves user data by subject (UUID).
   */
  async getUserById(userId: string): Promise<UserData | null> {
    const [result] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!result) return null;

    return {
      id: result.id,
      nric: result.nric || '',
      name: result.name,
      email: result.email || '',
    };
  }
}
