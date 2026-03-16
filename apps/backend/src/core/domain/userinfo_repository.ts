import { UserData } from './userinfo_claims';
import { MyinfoPerson } from './myinfo-person';

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

  /**
   * Retrieves full Myinfo profile for the user.
   */
  getMyinfoProfile(userId: string): Promise<MyinfoPerson | null>;

  /**
   * Retrieves user by NRIC.
   */
  getUserByNric(nric: string): Promise<UserData | null>;
}
