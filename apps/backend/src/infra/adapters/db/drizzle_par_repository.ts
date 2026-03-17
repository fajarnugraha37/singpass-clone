import { eq, and, gt } from 'drizzle-orm';
import { db } from '../../database/client';
import * as schema from '../../database/schema';
import type { PARRepository, PushedAuthorizationRequest } from '../../../core/domain/par.types';

export class DrizzlePARRepository implements PARRepository {
  async save(request: PushedAuthorizationRequest): Promise<void> {
    await db.insert(schema.parRequests).values({
      requestUri: request.requestUri,
      clientId: request.clientId,
      purpose: request.purpose,
      dpopJkt: request.dpopJkt,
      payload: request.payload,
      expiresAt: request.expiresAt,
    });
  }

  async getByRequestUri(requestUri: string): Promise<PushedAuthorizationRequest | null> {
    const now = new Date();
    const [result] = await db.select()
      .from(schema.parRequests)
      .where(
        and(
          eq(schema.parRequests.requestUri, requestUri),
          gt(schema.parRequests.expiresAt, now)
        )
      );

    if (!result) return null;

    return {
      id: result.id,
      requestUri: result.requestUri,
      clientId: result.clientId,
      purpose: result.purpose,
      dpopJkt: result.dpopJkt,
      payload: result.payload as Record<string, any>,
      expiresAt: result.expiresAt,
      createdAt: result.createdAt || undefined,
    };
  }

  async isJtiConsumed(jti: string, clientId: string): Promise<boolean> {
    const [result] = await db.select()
      .from(schema.usedJtis)
      .where(
        and(
          eq(schema.usedJtis.jti, jti),
          eq(schema.usedJtis.clientId, clientId)
        )
      );
    return !!result;
  }

  async consumeJti(jti: string, clientId: string, expiresAt: Date): Promise<void> {
    await db.insert(schema.usedJtis).values({
      jti,
      clientId,
      expiresAt,
    });
  }
}
