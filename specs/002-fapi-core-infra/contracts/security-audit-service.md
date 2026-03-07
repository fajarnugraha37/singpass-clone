# Contract: SecurityAuditService

The `SecurityAuditService` provides a unified interface for recording security-critical events across the FAPI 2.0 infrastructure.

## Interface Definition

```typescript
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

export type SecurityEventType = 
  | 'CLIENT_AUTH_SUCCESS'
  | 'CLIENT_AUTH_FAIL'
  | 'PAR_CREATED'
  | 'PAR_RETRIEVED'
  | 'DPOP_VALIDATION_SUCCESS'
  | 'DPOP_VALIDATION_FAIL'
  | 'AUTH_CODE_ISSUED'
  | 'AUTH_CODE_EXCHANGED'
  | 'UNKNOWN_CLIENT_REJECTED';

export type SecurityEventSeverity = 'INFO' | 'WARN' | 'ERROR';
```

## Implementation Requirements

- **Persistence**: MUST write to the `security_audit_log` SQLite table.
- **Observability**: MUST also output as structured JSON logs to standard output for log aggregation systems.
- **Fail-safe**: Logging failures should not block the primary transaction but should be reported separately.
