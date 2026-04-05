import * as jose from 'jose';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

/**
 * Utility for hardened JWT signing and key management.
 * In a production-ready environment, keys are retrieved from environment variables.
 */

let cachedPrivateKey: jose.CryptoKey | null = null;
let cachedPublicKey: jose.CryptoKey | null = null;

/**
 * Resets the key cache (for testing purposes).
 */
export function resetKeyCache() {
  cachedPrivateKey = null;
  cachedPublicKey = null;
}

/**
 * Loads the server's private key for signing.
 * The key is expected in the OIDC_PRIVATE_KEY environment variable (PEM format).
 */
export async function getSigningKey(): Promise<{ key: jose.CryptoKey, kid: string }> {
  if (cachedPrivateKey) return { key: cachedPrivateKey, kid: 'server-v1' };

  const pem = process.env.OIDC_PRIVATE_KEY;
  if (!pem || pem.includes('...')) {
    const isTestOrDev = process.env.NODE_ENV !== 'production';
    if (isTestOrDev) {
      // For tests or local dev, generate a temporary key if not provided
      console.warn('⚠️ [DEV/TEST] OIDC_PRIVATE_KEY is missing or invalid. Auto-generating a persistent ES256 key for this environment.');
      const { publicKey, privateKey } = await jose.generateKeyPair('ES256', { extractable: true });
      cachedPrivateKey = privateKey as jose.CryptoKey;
      cachedPublicKey = publicKey as jose.CryptoKey;
      
      try {
        const pkcs8Pem = await jose.exportPKCS8(cachedPrivateKey);
        const formattedForEnv = pkcs8Pem.replace(/\n/g, '\\n');
        
        const envPath = path.resolve(process.cwd(), '.env');
        let envContent = '';
        try {
          envContent = await fs.readFile(envPath, 'utf-8');
        } catch (e) {
          // File might not exist
        }
        
        if (envContent.includes('OIDC_PRIVATE_KEY=')) {
          envContent = envContent.replace(/OIDC_PRIVATE_KEY=.*(?:\r?\n|$)/g, `OIDC_PRIVATE_KEY="${formattedForEnv}"\n`);
        } else {
          envContent += `\nOIDC_PRIVATE_KEY="${formattedForEnv}"\n`;
        }
        
        await fs.writeFile(envPath, envContent, 'utf-8');
        process.env.OIDC_PRIVATE_KEY = formattedForEnv;
        console.log('✅ Generated and saved new OIDC_PRIVATE_KEY to .env file');
      } catch (err) {
        console.error('Failed to save auto-generated key to .env file:', err);
      }
      
      return { key: cachedPrivateKey, kid: 'test-server-v1' };
    }
    throw new Error('OIDC_PRIVATE_KEY is not configured or contains placeholder value.');
  }

  // Handle newlines in PEM string (often passed with \n in env)
  const formattedPem = pem.replace(/\\n/g, '\n');
  cachedPrivateKey = await jose.importPKCS8(formattedPem, 'ES256', { extractable: true }) as jose.CryptoKey;
  
  // Extract and cache the public key immediately
  const jwk = await jose.exportJWK(cachedPrivateKey);
  const { d, ...publicJwk } = jwk;
  cachedPublicKey = await jose.importJWK({ ...publicJwk, alg: 'ES256', use: 'sig' }, 'ES256') as jose.CryptoKey;
  
  return { key: cachedPrivateKey, kid: 'server-v1' };
}

/**
 * Returns the public key corresponding to the signing key.
 * This is used for generating the JWKS response.
 */
export async function getPublicJWK(): Promise<jose.JWK> {
  const publicKey = await getVerificationKey();
  const jwk = await jose.exportJWK(publicKey);
  const { kid } = await getSigningKey();
  
  return {
    ...jwk,
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

/**
 * Loads the public key for verifying signed JWTs.
 */
export async function getVerificationKey(): Promise<jose.CryptoKey> {
  if (cachedPublicKey) return cachedPublicKey;
  await getSigningKey();
  return cachedPublicKey!;
}

/**
 * Verifies a JWT signed by this server.
 */
export async function verifySingpassJWT(token: string): Promise<jose.JWTPayload> {
  const publicKey = await getVerificationKey();
  const issuer = process.env.OIDC_ISSUER || 'https://localhost';

  const { payload } = await jose.jwtVerify(token, publicKey, {
    issuer,
  });

  return payload;
}
