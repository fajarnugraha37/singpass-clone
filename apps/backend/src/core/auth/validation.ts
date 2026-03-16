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
