import { eq, and, gt } from 'drizzle-orm';
import type { AuthDataService, Session, AuthCodeSessionData } from '../../core/domain/auth_data_service';
import { db } from '../database/client';
import { parRequests, sessions, authorizationCodes } from '../database/schema';
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
      clientId: validated.client_id,
      purpose: validated.purpose,
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
      amr: JSON.stringify([]),
      isAuthenticated: false,
      expiresAt,
    }).returning({ id: sessions.id });

    return { sessionId: inserted.id };
  }

  async updateSession(sessionId: string, data: { loa: number; amr: string[]; isAuthenticated: boolean }): Promise<void> {
    await db.update(sessions)
      .set({ 
        loa: data.loa, 
        amr: JSON.stringify(data.amr),
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

    if (!result) return null;

    return {
      ...result,
      amr: result.amr ? JSON.parse(result.amr) : [],
    } as Session;
  }

  async issueAuthCode(
    sessionId: string,
    parId: number,
    codeChallenge: string,
    dpopJkt: string
  ): Promise<{ code: string }> {
    const session = await this.getSession(sessionId);
    if (!session) throw new Error('Session not found');

    const code = crypto.randomUUID(); // Simplification for now
    const expiresAt = new Date(Date.now() + this.authCodeTtlSeconds * 1000);

    // Retrieve original PAR to get clientId and redirectUri and scope
    const [par] = await db.select().from(parRequests).where(eq(parRequests.id, parId)).limit(1);
    if (!par) throw new Error('PAR not found');

    await db.insert(authorizationCodes).values({
      code,
      userId: session.userId!,
      clientId: par.clientId,
      codeChallenge,
      dpopJkt,
      scope: (par.payload as any).scope || 'openid',
      nonce: (par.payload as any).nonce || null,
      loa: session.loa,
      amr: JSON.stringify(session.amr),
      redirectUri: (par.payload as any).redirect_uri,
      expiresAt,
      used: false,
      createdAt: new Date(),
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
      code: authorizationCodes.code,
      dpopJkt: authorizationCodes.dpopJkt,
      userId: authorizationCodes.userId,
      loa: authorizationCodes.loa,
      amr: authorizationCodes.amr,
    })
      .from(authorizationCodes)
      .where(
        and(
          eq(authorizationCodes.code, code),
          eq(authorizationCodes.used, false),
          gt(authorizationCodes.expiresAt, now)
        )
      );

    if (!result) return null;

    // Mark code as used
    await db.update(authorizationCodes)
      .set({ used: true })
      .where(eq(authorizationCodes.code, code));

    await this.auditService?.logEvent({
      type: 'AUTH_CODE_EXCHANGED',
      severity: 'INFO',
      details: { code: result.code },
    });

    // Note: AuthCodeSessionData doesn't exactly match our new schema perfectly but we adapt
    return {
      sessionId: 'legacy-adapter', // We don't store sessionId in authorization_codes anymore
      parId: 0, 
      dpopJkt: result.dpopJkt,
      userId: result.userId,
      loa: result.loa,
      amr: result.amr ? JSON.parse(result.amr) : [],
    } as AuthCodeSessionData;
  }

  async invalidateSession(sessionId: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
  }
}
