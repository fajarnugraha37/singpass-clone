import type { SecurityAuditService, SecurityEventType, SecurityEventSeverity, AuditLogEntry } from '../../core/domain/audit_service';
import { db } from '../database/client';
import { securityAuditLog } from '../database/schema';
import { eq } from 'drizzle-orm';

export class DrizzleSecurityAuditService implements SecurityAuditService {
  /**
   * Records a security event to both persistent storage (SQLite) and application logs (console).
   */
  async logEvent(event: {
    type: SecurityEventType;
    severity: SecurityEventSeverity;
    clientId?: string;
    details?: Record<string, any>;
    ipAddress?: string;
  }): Promise<void> {
    const timestamp = new Date();
    
    // 1. Structured Application Log (Console)
    const logOutput = {
      timestamp: timestamp.toISOString(),
      ...event
    };
    
    if (event.severity === 'ERROR') {
      console.error(JSON.stringify(logOutput));
    } else if (event.severity === 'WARN') {
      console.warn(JSON.stringify(logOutput));
    } else {
      console.info(JSON.stringify(logOutput));
    }

    // 2. Persistent Storage (SQLite)
    try {
      await db.insert(securityAuditLog).values({
        eventType: event.type,
        severity: event.severity,
        clientId: event.clientId || null,
        details: event.details || null,
        ipAddress: event.ipAddress || null,
        createdAt: timestamp,
      });
    } catch (error) {
      // Fail-safe: Logging failures should not block the primary transaction
      console.error('Failed to write to security_audit_log table:', error);
    }
  }

  /**
   * Retrieves audit logs for a specific client.
   */
  async getLogsByClient(clientId: string): Promise<AuditLogEntry[]> {
    const results = await db.select()
      .from(securityAuditLog)
      .where(eq(securityAuditLog.clientId, clientId))
      .orderBy(securityAuditLog.createdAt);

    return results as AuditLogEntry[];
  }
}
