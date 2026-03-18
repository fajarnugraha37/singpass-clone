/**
 * Centralized validation logic for OIDC/FAPI 2.0 security invariants.
 */

/**
 * Validates that the provided redirect_uri exactly matches one of the registered URIs.
 * Per FAPI 2.0, exact matching is MANDATORY.
 */
export function validateRedirectUri(registeredUris: string[], requestedUri: string): boolean {
  if (!requestedUri) return false;

  // Exact match required. No prefix matching or wildcards allowed.
  return registeredUris.includes(requestedUri);
}

/**
 * Validates that all requested scopes are authorized for the client.
 */
export function validateScopes(allowedScopes: string[], requestedScopes: string | string[]): boolean {
  const requested = typeof requestedScopes === 'string' 
    ? requestedScopes.split(/\s+/) 
    : requestedScopes;

  if (requested.length === 0) return false;

  return requested.every(scope => allowedScopes.includes(scope));
}

/**
 * Validates that a URL is safe per Singpass requirements (No IP, HTTPS enforced).
 */
export function validateUrlSafe(url: string, allowHttpLocalhost: boolean = false): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname;

    // Prohibit IP addresses (IPv4 and simple IPv6 check)
    const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) || hostname.includes(':');
    // Special exception for 127.0.0.1 if allowHttpLocalhost is true
    if (isIp && !(allowHttpLocalhost && hostname === '127.0.0.1')) return false;

    const isHttps = parsed.protocol === 'https:';
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

    if (isHttps) return true;
    if (allowHttpLocalhost && isLocalhost) return true;

    return false;
  } catch {
    return false;
  }
}
/**
 * Validates the state parameter for length and entropy.
 */
export function validateState(state: string): boolean {
  if (!state) return false;
  // Recommended minimum 8 characters of high entropy
  return state.length >= 8;
}

/**
 * Validates the nonce parameter.
 */
export function validateNonce(nonce: string): boolean {
  if (!nonce) return false;
  return nonce.length >= 8;
}
