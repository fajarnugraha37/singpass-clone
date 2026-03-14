import { UserData } from './userinfo_claims';

export interface AccessTokenData {
  token: string;
  userId: string;
  clientId: string;
  dpopJkt: string;
  scope: string;
  loa: number;
  amr: string[];
  expiresAt: Date;
  revoked: boolean;
}

export interface UserInfoRepository {
  /**
   * Retrieves an access token by its value.
   */
  getAccessToken(token: string): Promise<AccessTokenData | null>;

  /**
   * Retrieves user data by subject (UUID).
   */
  getUserById(userId: string): Promise<UserData | null>;
}
