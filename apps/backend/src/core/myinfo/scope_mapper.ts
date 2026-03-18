/**
 * Utility for mapping OIDC scopes to MyInfo attributes.
 * Ensures data minimization by only returning fields the user has consented to.
 */

export const SCOPE_TO_ATTRIBUTES: Record<string, string[]> = {
  'openid': ['sub'],
  'profile': ['name', 'sex', 'dob'],
  'email': ['email'],
  'phone': ['mobileno'],
  'address': ['regadd'],
  
  // MyInfo Specific Scopes
  'uinfin': ['uinfin'],
  'name': ['name'],
  'sex': ['sex'],
  'race': ['race'],
  'dob': ['dob'],
  'residentialstatus': ['residentialstatus'],
  'nationality': ['nationality'],
  'birthcountry': ['birthcountry'],
  'regadd': ['regadd'],
  'mobileno': ['mobileno'],
  
  // Financial Scopes
  'cpfbalances': ['cpfbalances.oa', 'cpfbalances.ma', 'cpfbalances.ra', 'cpfbalances.sa'],
  'cpfbalances.oa': ['cpfbalances.oa'],
  'cpfbalances.ma': ['cpfbalances.ma'],
  'cpfbalances.ra': ['cpfbalances.ra'],
  'cpfbalances.sa': ['cpfbalances.sa'],
  'cpfcontributions': ['cpfcontributions'],
  'noa-basic': ['noa-basic'],
  'noa': ['noa'],
  'noahistory': ['noahistory'],
  
  // Vehicle Scopes
  'vehicles': ['vehicles'],
  
  // Family Scopes
  'marital': ['marital'],
  'marriagedate': ['marriagedate'],
  'childrenbirthrecords': ['childrenbirthrecords'],
};

/**
 * Returns a list of unique attribute names allowed by the given scopes.
 */
export function getAllowedAttributes(scopes: string[] = []): string[] {
  const attributes = new Set<string>();
  
  for (const scope of scopes) {
    const mapped = SCOPE_TO_ATTRIBUTES[scope];
    if (mapped) {
      mapped.forEach(attr => attributes.add(attr));
    }
  }
  
  return Array.from(attributes);
}

/**
 * Filters a person object to only include attributes allowed by the scopes.
 */
export function filterPersonByScopes(person: Record<string, any>, scopes: string[]): Record<string, any> {
  const allowed = getAllowedAttributes(scopes);
  const filtered: Record<string, any> = {};
  
  // Standard OIDC claims in the root
  if (person.sub) filtered.sub = person.sub;

  // MyInfo attributes are typically nested or flat depending on implementation
  // We'll handle both common patterns
  for (const attr of allowed) {
    if (person[attr] !== undefined) {
      filtered[attr] = person[attr];
    }
    
    // Handle nested finance/family/vehicles if they are in the person object
    if (attr.includes('.') && person.finance) {
      const parts = attr.split('.');
      if (parts[0] === 'cpfbalances' && person.finance[attr] !== undefined) {
        if (!filtered.finance) filtered.finance = {};
        filtered.finance[attr] = person.finance[attr];
      }
    }
    
    if (['cpfcontributions', 'noa-basic', 'noa', 'noahistory'].includes(attr) && person.finance) {
      if (!filtered.finance) filtered.finance = {};
      filtered.finance[attr] = person.finance[attr];
    }
    
    if (['marital', 'marriagedate', 'childrenbirthrecords'].includes(attr) && person.family) {
      if (!filtered.family) filtered.family = {};
      filtered.family[attr] = person.family[attr];
    }

    if (attr === 'vehicles' && person.vehicles) {
      filtered.vehicles = person.vehicles;
    }
  }
  
  return filtered;
}
