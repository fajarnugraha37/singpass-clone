export interface AuthorizationCode {
  code: string;
  userId: string;
  clientId: string;
  codeChallenge: string;
  dpopJkt: string;
  scope: string;
  nonce?: string | null;
  redirectUri: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
}

export interface AuthorizationCodeRepository {
  /**
   * Saves a new Authorization Code.
   */
  save(code: AuthorizationCode): Promise<void>;

  /**
   * Retrieves an Authorization Code by its value.
   * Only returns if it exists and is not expired and not already used.
   */
  getByCode(code: string): Promise<AuthorizationCode | null>;

  /**
   * Marks a code as used.
   */
  markAsUsed(code: string): Promise<void>;
}
