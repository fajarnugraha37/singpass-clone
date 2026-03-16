import * as jose from "jose";

export interface FetchOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
}

/**
 * Executes a secure HTTP fetch with JSON body handling.
 */
export async function secureFetch(url: string, options: FetchOptions = {}): Promise<Response> {
  const { method = 'GET', headers = {}, body } = options;
  
  const requestHeaders: Record<string, string> = { ...headers };
  
  let requestBody = body;
  if (body && typeof body === 'object' && !(body instanceof FormData)) {
    requestHeaders['Content-Type'] = 'application/json';
    requestBody = JSON.stringify(body);
  }

  return fetch(url, {
    method,
    headers: requestHeaders,
    body: requestBody,
  });
}

/**
 * Generates a DPoP (Demonstrating Proof-of-Possession) proof JWT.
 */
export async function generateDpopHeader(
  method: string, 
  url: string, 
  privateKey: jose.KeyLike, 
  nonce?: string
): Promise<string> {
  const jwt = await new jose.SignJWT({
    htm: method,
    htu: url,
    jti: Math.random().toString(36).substring(7),
    iat: Math.floor(Date.now() / 1000),
    nonce,
  })
    .setProtectedHeader({ 
      alg: 'ES256', 
      typ: 'dpop+jwt',
      jwk: await jose.exportJWK(privateKey).then(({ d, ...publicJwk }) => publicJwk)
    })
    .sign(privateKey);
  
  return jwt;
}
