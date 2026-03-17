export interface PushedAuthorizationRequest {
  id?: string | number;
  requestUri: string;
  clientId: string;
  dpopJkt?: string | null;
  payload: Record<string, any>;
  expiresAt: Date;
  createdAt?: Date;
}

export interface PARResponse {
  request_uri: string;
  expires_in: number;
  dpop_nonce?: string;
}

export interface ConsumedJti {
  jti: string;
  clientId: string;
  expiresAt: Date;
  createdAt?: Date;
}

export interface PARRepository {
  /**
   * Saves a new Pushed Authorization Request.
   */
  save(request: PushedAuthorizationRequest): Promise<void>;

  /**
   * Retrieves a PAR request by its requestUri.
   * Only returns if it exists and is not expired.
   */
  getByRequestUri(requestUri: string): Promise<PushedAuthorizationRequest | null>;

  /**
   * Checks if a JTI has already been consumed for a client.
   */
  isJtiConsumed(jti: string, clientId: string): Promise<boolean>;

  /**
   * Marks a JTI as consumed.
   */
  consumeJti(jti: string, clientId: string, expiresAt: Date): Promise<void>;
}
