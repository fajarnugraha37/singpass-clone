export interface Session {
  id: string;
  userId: string | null;
  dpopJkt: string | null;
  loa: number;
  amr: string[];
  isAuthenticated: boolean;
  expiresAt: Date;
}

export interface AuthCodeSessionData {
  sessionId: string;
  parId: number;
  userId: string | null;
  dpopJkt: string;
  loa: number;
  amr: string[];
}

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
   * Updates session authentication status, LOA, and AMR.
   */
  updateSession(sessionId: string, data: { loa: number; amr: string[]; isAuthenticated: boolean }): Promise<void>;

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
