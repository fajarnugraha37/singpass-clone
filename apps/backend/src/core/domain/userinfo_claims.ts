import { mapLoaToAcr } from './claims';

export interface PersonInfoField {
  value: string;
}

export interface PersonInfo {
  uinfin?: PersonInfoField;
  name?: PersonInfoField;
  email?: PersonInfoField;
  mobileno?: PersonInfoField;
}

export interface UserInfoClaims {
  sub: string;
  iss: string;
  aud: string;
  iat: number;
  person_info?: PersonInfo; // Legacy field for compat
  acr: string;
  amr: string[];
  sub_type: string;
}

export interface UserData {
  id: string;
  nric: string;
  name: string;
  email: string;
  mobileno: string | null;
}

/**
 * Maps user database fields to UserInfo claims based on authorized scopes.
 */
export function mapUserInfoClaims(
  user: UserData,
  clientId: string,
  issuer: string,
  scopes: string[],
  loa: number,
  amr: string[]
): UserInfoClaims {
  const scopeSet = new Set(scopes);
  const person_info: PersonInfo = {};

  if (scopeSet.has('uinfin') && user.nric) {
    person_info.uinfin = { value: user.nric };
  }
  if (scopeSet.has('name') && user.name) {
    person_info.name = { value: user.name };
  }
  if (scopeSet.has('email') && user.email) {
    person_info.email = { value: user.email };
  }
  if (scopeSet.has('mobileno') && user.mobileno) {
    person_info.mobileno = { value: user.mobileno };
  }

  return {
    sub: user.id,
    iss: issuer,
    aud: clientId,
    iat: Math.floor(Date.now() / 1000),
    acr: mapLoaToAcr(loa),
    amr,
    sub_type: 'user',
    person_info,
  };
}
