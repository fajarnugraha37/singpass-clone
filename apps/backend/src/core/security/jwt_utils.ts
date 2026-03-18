import * as jose from 'jose';

/**
 * Utility for hardened JWT signing and key management.
 * In a production-ready environment, keys are retrieved from environment variables.
 */

let cachedPrivateKey: jose.CryptoKey | null = null;
let cachedPublicKey: jose.CryptoKey | null = null;

/**
 * Loads the server's private key for signing.
 * The key is expected in the OIDC_PRIVATE_KEY environment variable (PEM format).
 */
export async function getSigningKey(): Promise<{ key: jose.CryptoKey, kid: string }> {
  if (cachedPrivateKey) return { key: cachedPrivateKey, kid: 'server-v1' };

  const pem = process.env.OIDC_PRIVATE_KEY;
  if (!pem || pem.includes('-----BEGIN PRIVATE KEY-----\\n...')) {
    throw new Error('OIDC_PRIVATE_KEY is not configured or contains placeholder value.');
  }

  // Handle newlines in PEM string (often passed with \n in env)
  const formattedPem = pem.replace(/\\n/g, '\n');
  cachedPrivateKey = await jose.importPKCS8(formattedPem, 'ES256', { extractable: true });
  
  return { key: cachedPrivateKey, kid: 'server-v1' };
}

/**
 * Returns the public key corresponding to the signing key.
 * This is used for generating the JWKS response.
 */
export async function getPublicJWK(): Promise<jose.JWK> {
  const { key, kid } = await getSigningKey();
  
  // Export part to JWK
  const jwk = await jose.exportJWK(key);
  
  // Security: Ensure private component is NOT included
  const { d, ...publicJwk } = jwk;

  return {
    ...publicJwk,
    kid,
    use: 'sig',
    alg: 'ES256'
  };
}

/**
 * Signs a payload as a JWT for Singpass-compliant flows.
 */
export async function signSingpassJWT(payload: Record<string, any>, options: { expiresIn?: string } = {}): Promise<string> {
  const { key, kid } = await getSigningKey();
  const issuer = process.env.OIDC_ISSUER || 'https://localhost';

  return await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'ES256', kid, typ: 'JWT' })
    .setIssuedAt()
    .setIssuer(issuer)
    .setExpirationTime(options.expiresIn || '1h')
    .sign(key);
}
