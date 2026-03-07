import { eq, and, gt } from 'drizzle-orm';
import type { AuthDataService, Session, AuthCodeSessionData } from '../../core/domain/auth_data_service';
import { db } from '../database/client';
import { parRequests, sessions, authCodes } from '../database/schema';
import { parRequestSchema, sharedConfig } from '../../../../../packages/shared/src/config';
import type { SecurityAuditService } from '../../core/domain/audit_service';

export class DrizzleAuthDataService implements AuthDataService {
  private parTtlSeconds = sharedConfig.SECURITY.PAR_TTL_SECONDS;
  private sessionTtlSeconds = sharedConfig.SECURITY.SESSION_TTL_SECONDS;
  private authCodeTtlSeconds = sharedConfig.SECURITY.AUTH_CODE_TTL_SECONDS;

  constructor(private auditService?: SecurityAuditService) {}

  /**
   * T014: Pushes authorization parameters and returns a unique request_uri.
   */
  async createPAR(payload: any): Promise<{ request_uri: string; expires_in: number }> {
    // Validate payload
    const validated = parRequestSchema.parse(payload);

    const expiresAt = new Date(Date.now() + this.parTtlSeconds * 1000);

    // Initial insert to get the sequential ID
    // SQLite auto-increment ID is returned after insert.
    const [inserted] = await db.insert(parRequests).values({
      requestUri: 'PENDING',
      payload: validated,
      expiresAt,
    }).returning({ id: parRequests.id });

    const request_uri = `urn:ietf:params:oauth:request_uri:${inserted.id}`;

    // Update with final URI
    await db.update(parRequests)
      .set({ requestUri: request_uri })
      .where(eq(parRequests.id, inserted.id));

    await this.auditService?.logEvent({
      type: 'PAR_CREATED',
      severity: 'INFO',
      clientId: validated.client_id,
      details: { request_uri },
    });

    return {
      request_uri,
      expires_in: this.parTtlSeconds,
    };
  }

  /**
   * T015: Retrieves a PAR request by its URI with TTL enforcement.
   */
  async getPAR(request_uri: string): Promise<any | null> {
    const now = new Date();
    const [result] = await db.select()
      .from(parRequests)
      .where(
        and(
          eq(parRequests.requestUri, request_uri),
          gt(parRequests.expiresAt, now)
        )
      );

    if (!result) return null;

    const payload = typeof result.payload === 'string' ? JSON.parse(result.payload) : result.payload;

    await this.auditService?.logEvent({
      type: 'PAR_RETRIEVED',
      severity: 'INFO',
      clientId: payload.client_id,
      details: { request_uri },
    });

    return payload;
  }

  async createSession(userId?: string, dpopJkt?: string): Promise<{ sessionId: string }> {
    const expiresAt = new Date(Date.now() + this.sessionTtlSeconds * 1000);
    const [inserted] = await db.insert(sessions).values({
      userId: userId || null,
      dpopJkt: dpopJkt || null,
      loa: 0,
      isAuthenticated: false,
      expiresAt,
    }).returning({ id: sessions.id });

    return { sessionId: inserted.id };
  }

  async updateSession(sessionId: string, data: { loa: number; isAuthenticated: boolean }): Promise<void> {
    await db.update(sessions)
      .set({ 
        loa: data.loa, 
        isAuthenticated: data.isAuthenticated 
      })
      .where(eq(sessions.id, sessionId));
  }

  async getSession(sessionId: string): Promise<Session | null> {
    const now = new Date();
    const [result] = await db.select()
      .from(sessions)
      .where(
        and(
          eq(sessions.id, sessionId),
          gt(sessions.expiresAt, now)
        )
      );

    return result || null;
  }

  async issueAuthCode(
    sessionId: string,
    parId: number,
    codeChallenge: string,
    dpopJkt: string
  ): Promise<{ code: string }> {
    const code = crypto.randomUUID(); // Simplification for now
    const expiresAt = new Date(Date.now() + this.authCodeTtlSeconds * 1000);

    await db.insert(authCodes).values({
      code,
      sessionId,
      parId,
      codeChallenge,
      codeChallengeMethod: 'S256',
      dpopJkt,
      expiresAt,
    });

    await this.auditService?.logEvent({
      type: 'AUTH_CODE_ISSUED',
      severity: 'INFO',
      details: { sessionId, parId },
    });

    return { code };
  }

  async exchangeAuthCode(code: string): Promise<AuthCodeSessionData | null> {
    const now = new Date();
    const [result] = await db.select({
      sessionId: authCodes.sessionId,
      parId: authCodes.parId,
      dpopJkt: authCodes.dpopJkt,
      userId: sessions.userId,
      loa: sessions.loa,
    })
      .from(authCodes)
      .innerJoin(sessions, eq(authCodes.sessionId, sessions.id))
      .where(
        and(
          eq(authCodes.code, code),
          gt(authCodes.expiresAt, now)
        )
      );

    if (!result) return null;

    // Delete code after use
    await db.delete(authCodes).where(eq(authCodes.code, code));

    await this.auditService?.logEvent({
      type: 'AUTH_CODE_EXCHANGED',
      severity: 'INFO',
      details: { sessionId: result.sessionId, parId: result.parId },
    });

    return result as AuthCodeSessionData;
  }

  async invalidateSession(sessionId: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
  }
}
