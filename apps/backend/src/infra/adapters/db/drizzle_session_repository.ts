import { eq } from 'drizzle-orm';
import { db } from '../../database/client';
import * as schema from '../../database/schema';
import type { AuthSession, AuthSessionRepository, AuthSessionStatus } from '../../../core/domain/session.ts';

export class DrizzleAuthSessionRepository implements AuthSessionRepository {
  async save(session: AuthSession): Promise<void> {
    await db.insert(schema.authSessions).values({
      id: session.id,
      parRequestUri: session.parRequestUri,
      clientId: session.clientId,
      userId: session.userId,
      status: session.status,
      otpCode: session.otpCode,
      retryCount: session.retryCount,
      loa: session.loa,
      amr: JSON.stringify(session.amr),
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    });
  }

  async getById(id: string): Promise<AuthSession | null> {
    const [result] = await db.select()
      .from(schema.authSessions)
      .where(eq(schema.authSessions.id, id));

    if (!result) return null;

    return {
      id: result.id,
      parRequestUri: result.parRequestUri,
      clientId: result.clientId,
      userId: result.userId,
      status: result.status as AuthSessionStatus,
      otpCode: result.otpCode,
      retryCount: result.retryCount,
      loa: result.loa,
      amr: result.amr ? JSON.parse(result.amr) : [],
      expiresAt: result.expiresAt,
      createdAt: result.createdAt!,
      updatedAt: result.updatedAt!,
    };
  }

  async update(session: AuthSession): Promise<void> {
    await db.update(schema.authSessions)
      .set({
        userId: session.userId,
        status: session.status,
        otpCode: session.otpCode,
        retryCount: session.retryCount,
        loa: session.loa,
        amr: JSON.stringify(session.amr),
        updatedAt: new Date(),
      })
      .where(eq(schema.authSessions.id, session.id));
  }

  async delete(id: string): Promise<void> {
    await db.delete(schema.authSessions)
      .where(eq(schema.authSessions.id, id));
  }
}
