import * as jose from 'jose';

export interface IDTokenClaims extends jose.JWTPayload {
  sub: string;
  aud: string;
  iss: string;
  iat: number;
  exp: number;
  nonce?: string;
  auth_time?: number;
  at_hash?: string;
  c_hash?: string;
  sid?: string;
  // FAPI 2.0 / Singpass specific
  acr?: string;
  amr?: string[];
}

/**
 * Signs an ID Token payload using the server's private key (JWS).
 */
export async function signIDToken(
  payload: IDTokenClaims,
  privateKey: jose.KeyLike | Uint8Array,
  kid: string,
  alg: string = 'ES256'
): Promise<string> {
  return await new jose.SignJWT(payload)
    .setProtectedHeader({ alg, kid, typ: 'JWT' })
    .sign(privateKey);
}

/**
 * Encrypts a signed ID Token (JWS) using the client's public key (JWE).
 * Per Singpass: ECDH-ES+A256KW for key wrap, A256GCM for content encryption.
 */
export async function encryptIDToken(
  jws: string,
  clientPublicKey: jose.KeyLike | jose.JWK,
  alg: string = 'ECDH-ES+A256KW',
  enc: string = 'A256GCM'
): Promise<string> {
  const isJWK = typeof clientPublicKey === 'object' && 'kty' in clientPublicKey;
  const publicKey = isJWK
    ? await jose.importJWK(clientPublicKey as jose.JWK, alg)
    : clientPublicKey;

  return await new jose.CompactEncrypt(new TextEncoder().encode(jws))
    .setProtectedHeader({ alg, enc, typ: 'JWT' })
    .encrypt(publicKey as jose.KeyLike);
}

/**
 * Helper to generate a nested JWT (signed then encrypted) as an ID Token.
 */
export async function generateEncryptedIDToken(
  payload: IDTokenClaims,
  serverPrivateKey: jose.KeyLike | Uint8Array,
  serverKid: string,
  clientPublicKey: jose.KeyLike | jose.JWK,
  signingAlg: string = 'ES256',
  encryptionAlg: string = 'ECDH-ES+A256KW',
  encryptionEnc: string = 'A256GCM'
): Promise<string> {
  const signedJwt = await signIDToken(payload, serverPrivateKey, serverKid, signingAlg);
  return await encryptIDToken(signedJwt, clientPublicKey, encryptionAlg, encryptionEnc);
}
