export interface SubAttributes {
  identity_number?: string;
  identity_coi?: string;
  account_type?: string;
  name?: string;
  email?: string;
  mobileno?: string;
}

export interface UserAttributes {
  nric: string;
  name: string;
  email?: string;
  mobileno?: string;
  account_type?: string;
}

export function mapLoaToAcr(loa: number): string {
  switch (loa) {
    case 1:
      return 'urn:singpass:authentication:loa:1';
    case 2:
      return 'urn:singpass:authentication:loa:2';
    case 3:
      return 'urn:singpass:authentication:loa:3';
    default:
      return 'urn:singpass:authentication:loa:1';
  }
}

export function buildSubAttributes(user: UserAttributes, scopes: string[]): SubAttributes | undefined {
  const subAttributes: SubAttributes = {};
  let hasAttributes = false;

  if (scopes.includes('user.identity')) {
    if (user.nric) {
      subAttributes.identity_number = user.nric;
    }
    subAttributes.identity_coi = 'SG';
    subAttributes.account_type = user.account_type || 'standard';
    hasAttributes = true;
  }

  if (scopes.includes('name') && user.name) {
    subAttributes.name = user.name;
    hasAttributes = true;
  }

  if (scopes.includes('email') && user.email) {
    subAttributes.email = user.email;
    hasAttributes = true;
  }

  if (scopes.includes('mobileno') && user.mobileno) {
    subAttributes.mobileno = user.mobileno;
    hasAttributes = true;
  }

  return hasAttributes ? subAttributes : undefined;
}
