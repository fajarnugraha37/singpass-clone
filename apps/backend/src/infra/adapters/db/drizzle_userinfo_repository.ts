import { eq, and, sql } from 'drizzle-orm';
import { db } from '../../database/client';
import { users, accessTokens, myinfoProfiles, userAccountLinks } from '../../database/schema';
import { UserInfoRepository, AccessTokenData } from '../../../core/domain/userinfo_repository';
import { UserData } from '../../../core/domain/userinfo_claims';
import { MyinfoPerson } from '../../../core/domain/myinfo-person';

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
      loa: result.loa,
      amr: result.amr ? JSON.parse(result.amr) : [],
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
      mobileno: result.mobileno,
    };
  }

  /**
   * Retrieves full Myinfo profile for the user.
   */
  async getMyinfoProfile(userId: string): Promise<MyinfoPerson | null> {
    const [result] = await db
      .select()
      .from(myinfoProfiles)
      .where(eq(myinfoProfiles.userId, userId))
      .limit(1);

    if (!result) return null;

    return result.data as MyinfoPerson;
  }

  /**
   * Retrieves user by NRIC.
   */
  async getUserByNric(nric: string): Promise<UserData | null> {
    const [result] = await db
      .select()
      .from(users)
      .where(eq(users.nric, nric))
      .limit(1);

    if (!result) return null;

    return {
      id: result.id,
      nric: result.nric || '',
      name: result.name,
      email: result.email || '',
      mobileno: result.mobileno,
      passwordHash: result.passwordHash || undefined,
    };
  }

  /**
   * Creates a new user (US4 Compliance).
   */
  async createUser(user: Omit<UserData, 'id'> & { passwordHash?: string, uen?: string }): Promise<UserData> {
    const [result] = await db
      .insert(users)
      .values({
        nric: user.nric,
        name: user.name,
        email: user.email,
        mobileno: user.mobileno,
        passwordHash: user.passwordHash,
        uen: user.uen,
      })
      .returning();

    return {
      id: result.id,
      nric: result.nric || '',
      name: result.name,
      email: result.email || '',
      mobileno: result.mobileno,
    };
  }

  /**
   * Counts users associated with a specific UEN (US4 Compliance).
   */
  async countUsersByUen(uen: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.uen, uen))
      .get();

    return (result?.count as number) || 0;
  }

  /**
   * Deletes a user by ID.
   */
  async deleteUser(userId: string): Promise<void> {
    await db.delete(users).where(eq(users.id, userId));
  }

  /**
   * Links a user to a client (for test account tracking).
   */
  async linkUserToClient(userId: string, clientId: string): Promise<void> {
    await db.insert(userAccountLinks).values({
      userId,
      clientId,
    });
  }

  /**
   * Counts the number of users linked to a client.
   */
  async countUsersByClient(clientId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(userAccountLinks)
      .where(eq(userAccountLinks.clientId, clientId))
      .get();

    return (result?.count as number) || 0;
  }

  /**
   * Checks if a user is linked to a client.
   */
  async isUserLinkedToClient(userId: string, clientId: string): Promise<boolean> {
    const [result] = await db
      .select()
      .from(userAccountLinks)
      .where(and(eq(userAccountLinks.userId, userId), eq(userAccountLinks.clientId, clientId)))
      .limit(1);

    return !!result;
  }
}
