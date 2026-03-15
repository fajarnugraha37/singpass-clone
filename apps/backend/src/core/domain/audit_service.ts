export type SecurityEventType = 
  | 'CLIENT_AUTH_SUCCESS'
  | 'CLIENT_AUTH_FAIL'
  | 'PAR_CREATED'
  | 'PAR_RETRIEVED'
  | 'DPOP_VALIDATION_SUCCESS'
  | 'DPOP_VALIDATION_FAIL'
  | 'AUTH_CODE_ISSUED'
  | 'AUTH_CODE_EXCHANGED'
  | 'UNKNOWN_CLIENT_REJECTED'
  | 'AUTH_INITIATION_SUCCESS'
  | 'AUTH_INITIATION_FAILURE'
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE'
  | '2FA_SUCCESS'
  | '2FA_FAILURE'
  | 'AUTH_CODE_GENERATION_FAILURE'
  | 'AUTH_CODE_GENERATED'
  | 'USERINFO_SUCCESS'
  | 'USERINFO_FAILURE'
  | 'AUTH_TERMINAL_FAILURE'
  | 'KEY_ROTATION_GENERATE';

export type SecurityEventSeverity = 'INFO' | 'WARN' | 'ERROR';

export interface AuditLogEntry {
  id: string;
  eventType: SecurityEventType;
  severity: SecurityEventSeverity;
  details: Record<string, any> | null;
  clientId: string | null;
  ipAddress: string | null;
  createdAt: Date;
}

export interface SecurityAuditService {
  /**
   * Records a security event to both persistent storage and application logs.
   */
  logEvent(event: {
    type: SecurityEventType;
    severity: SecurityEventSeverity;
    clientId?: string;
    details?: Record<string, any>;
    ipAddress?: string;
  }): Promise<void>;

  /**
   * Retrieves audit logs for a specific client (for monitoring).
   */
  getLogsByClient(clientId: string): Promise<AuditLogEntry[]>;
}
