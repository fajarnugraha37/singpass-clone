# Contract: AuthDataService

The `AuthDataService` provides a unified interface for managing the FAPI 2.0 specific entities in the SQLite database using Drizzle ORM.

## Interface Definition

```typescript
export interface AuthDataService {
  /**
   * Pushes authorization parameters and returns a unique request_uri.
   */
  createPAR(payload: any): Promise<{ request_uri: string; expires_in: number }>;

  /**
   * Retrieves a PAR request by its URI.
   */
  getPAR(request_uri: string): Promise<any | null>;

  /**
   * Creates a new session, optionally binding it to a user and DPoP JKT.
   */
  createSession(userId?: string, dpopJkt?: string): Promise<{ sessionId: string }>;

  /**
   * Updates session authentication status and LOA (Level of Assurance).
   */
  updateSession(sessionId: string, data: { loa: number; isAuthenticated: boolean }): Promise<void>;

  /**
   * Retrieves an active session by its ID.
   */
  getSession(sessionId: string): Promise<Session | null>;

  /**
   * Issues an authorization code linked to a session and PAR.
   */
  issueAuthCode(
    sessionId: string, 
    parId: number, 
    codeChallenge: string, 
    dpopJkt: string
  ): Promise<{ code: string }>;

  /**
   * Validates and exchanges an authorization code for its session data.
   */
  exchangeAuthCode(code: string): Promise<AuthCodeSessionData | null>;

  /**
   * Invalidates a session (e.g., on logout or expiration).
   */
  invalidateSession(sessionId: string): Promise<void>;
}
```

## Data Persistence Constraints

- **Atomicity**: Updates to sessions and auth codes MUST be transactional.
- **TTL Enforcment**: MUST automatically purge expired PAR requests and authorization codes during retrieval or via a periodic cleanup job.
- **Validation**: Input payloads MUST be validated against their respective Zod schemas before persistence.
