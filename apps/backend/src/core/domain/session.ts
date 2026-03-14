export type AuthSessionStatus = 'INITIATED' | 'PRIMARY_AUTH_SUCCESS' | '2FA_PENDING' | 'COMPLETED' | 'FAILED';

export interface AuthSession {
  id: string;
  parRequestUri: string;
  clientId: string;
  userId?: string | null;
  status: AuthSessionStatus;
  otpCode?: string | null;
  retryCount: number;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthSessionRepository {
  /**
   * Saves a new Auth Session.
   */
  save(session: AuthSession): Promise<void>;

  /**
   * Retrieves an Auth Session by its ID.
   */
  getById(id: string): Promise<AuthSession | null>;

  /**
   * Updates an existing Auth Session.
   */
  update(session: AuthSession): Promise<void>;

  /**
   * Deletes an Auth Session (e.g. on completion or failure).
   */
  delete(id: string): Promise<void>;
}
