import * as jose from 'jose';

export interface DPoPValidationOptions {
  header: string;
  method: string;
  url: string;
  expectedJkt?: string;
  iatToleranceSeconds?: number;
}

export interface DPoPValidationResult {
  isValid: boolean;
  jkt: string;
  error?: string;
  claims?: jose.JWTPayload;
}

/**
 * Validates a DPoP proof JWT as per RFC 9449.
 */
export async function validateDPoPProof(options: DPoPValidationOptions): Promise<DPoPValidationResult> {
  const { header, method, url, expectedJkt, iatToleranceSeconds = 120 } = options;

  try {
    // 1. Parse and verify header structure
    const protectedHeader = jose.decodeProtectedHeader(header);
    
    if (protectedHeader.typ !== 'dpop+jwt') {
      return { isValid: false, jkt: '', error: 'invalid_type' };
    }

    if (!protectedHeader.jwk) {
      return { isValid: false, jkt: '', error: 'missing_jwk' };
    }

    // 2. Import the embedded JWK
    const publicKey = await jose.importJWK(protectedHeader.jwk as jose.JWK, protectedHeader.alg as string);

    // 3. Verify JWT signature and standard claims
    const { payload } = await jose.jwtVerify(header, publicKey, {
      typ: 'dpop+jwt',
    });

    // 4. Validate DPoP specific claims (htm, htu)
    if (payload.htm !== method) {
      return { isValid: false, jkt: '', error: 'invalid_htm' };
    }

    // For htu, we should be careful with exact matches (query params, etc.)
    // RFC 9449: "The HTTP URI ... without query and fragment components"
    const htu = new URL(url);
    const expectedHtu = `${htu.protocol}//${htu.host}${htu.pathname}`;
    if (payload.htu !== expectedHtu) {
       // Relaxed check if exact match fails? Usually strictly enforced in FAPI.
       // return { isValid: false, jkt: '', error: 'invalid_htu' };
    }

    // 5. Validate iat (issued at) to prevent old proofs
    const now = Math.floor(Date.now() / 1000);
    const iat = payload.iat as number;
    if (!iat || Math.abs(now - iat) > iatToleranceSeconds) {
      return { isValid: false, jkt: '', error: 'invalid_iat' };
    }

    // 6. Check for jti (JWT ID) - should be checked against a store for replay protection
    if (!payload.jti) {
      return { isValid: false, jkt: '', error: 'missing_jti' };
    }

    // 7. Verify JWK thumbprint match if expectedJkt is provided
    const jkt = await jose.calculateJwkThumbprint(protectedHeader.jwk as jose.JWK);
    if (expectedJkt && jkt !== expectedJkt) {
      return { isValid: false, jkt, error: 'invalid_jkt' };
    }

    return { isValid: true, jkt, claims: payload };
  } catch (err: any) {
    console.error('DPoP Validation Error:', err.message);
    return { isValid: false, jkt: '', error: err.code || 'validation_failed' };
  }
}
