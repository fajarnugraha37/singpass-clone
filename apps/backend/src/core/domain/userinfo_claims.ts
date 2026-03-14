export interface PersonInfoField {
  value: string;
}

export interface PersonInfo {
  uinfin?: PersonInfoField;
  name?: PersonInfoField;
  email?: PersonInfoField;
}

export interface UserInfoClaims {
  sub: string;
  iss: string;
  aud: string;
  iat: number;
  person_info: PersonInfo;
}

export interface UserData {
  id: string;
  nric: string;
  name: string;
  email: string;
}

/**
 * Maps user database fields to UserInfo claims based on authorized scopes.
 */
export function mapUserInfoClaims(
  user: UserData,
  clientId: string,
  issuer: string,
  scopes: string[]
): UserInfoClaims {
  const person_info: PersonInfo = {};
  const scopeSet = new Set(scopes);

  if (scopeSet.has('uinfin')) {
    person_info.uinfin = { value: user.nric };
  }
  if (scopeSet.has('name')) {
    person_info.name = { value: user.name };
  }
  if (scopeSet.has('email')) {
    person_info.email = { value: user.email };
  }

  return {
    sub: user.id,
    iss: issuer,
    aud: clientId,
    iat: Math.floor(Date.now() / 1000),
    person_info,
  };
}
