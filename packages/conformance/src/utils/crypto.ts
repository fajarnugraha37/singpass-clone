import * as jose from "jose";

/**
 * Generates a PKCE code_verifier and code_challenge (S256).
 */
export async function generatePkce(): Promise<{ verifier: string; challenge: string }> {
  const verifier = jose.generateSecret('HS256').toString(); // Simple random string for mock
  // In a real implementation, we'd use a more robust random generator
  // But for this auditor, we just need a valid-looking challenge
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const challenge = jose.base64url.encode(new Uint8Array(hash));
  return { verifier, challenge };
}

/**
 * Validates an ID Token against the target's JWKS and expected claims.
 */
export async function validateIdToken(
  token: string, 
  jwksUrl: string, 
  issuer: string, 
  audience: string,
  nonce?: string
): Promise<jose.JWTPayload> {
  const JWKS = jose.createRemoteJWKSet(new URL(jwksUrl));
  const { payload } = await jose.jwtVerify(token, JWKS, {
    issuer,
    audience,
  });

  if (nonce && payload.nonce !== nonce) {
    throw new Error(`Nonce mismatch: expected ${nonce}, got ${payload.nonce}`);
  }

  return payload;
}

/**
 * Decodes a JWT without signature validation (for evidence collection).
 */
export function decodeJwt(token: string): jose.JWTPayload {
  return jose.decodeJwt(token);
}
