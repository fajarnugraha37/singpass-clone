import * as jose from 'jose';

export interface DPoPValidationOptions {
  proof: string;
  method: string;
  url: string;
  expectedJkt?: string;
  iatToleranceSeconds?: number;
  expectedNonce?: string;
  accessToken?: string;
}

export interface DPoPValidationResult {
  isValid: boolean;
  jkt: string;
  payload?: jose.JWTPayload;
  error?: string;
}

export interface JtiStore {
  isUsed(jti: string, clientId: string): Promise<boolean>;
  markUsed(jti: string, clientId: string, expiresAt: Date): Promise<void>;
}

export class DPoPValidator {
  constructor(
    private jtiStore?: JtiStore,
    private iatToleranceSeconds: number = 120
  ) {}

  async validate(
    clientId: string,
    options: DPoPValidationOptions
  ): Promise<DPoPValidationResult> {
    const { proof, method, url, expectedJkt, expectedNonce, accessToken } = options;

    try {
      const header = jose.decodeProtectedHeader(proof);
      if (header.typ !== 'dpop+jwt') {
        return { isValid: false, jkt: '', error: 'invalid_typ' };
      }

      if (!header.jwk) {
        return { isValid: false, jkt: '', error: 'missing_jwk' };
      }

      const publicKey = await jose.importJWK(header.jwk as jose.JWK, header.alg as string);
      const { payload } = await jose.jwtVerify(proof, publicKey, {
        typ: 'dpop+jwt',
      });

      // htm check
      if (payload.htm !== method) {
        return { isValid: false, jkt: '', error: 'invalid_htm' };
      }

      // htu check (strip query and fragment)
      const parsedUrl = new URL(url);
      const htu = `${parsedUrl.protocol}//${parsedUrl.host}${parsedUrl.pathname}`;
      if (payload.htu !== htu) {
        return { isValid: false, jkt: '', error: 'invalid_htu' };
      }

      // iat check
      const now = Math.floor(Date.now() / 1000);
      const iat = payload.iat || 0;
      if (Math.abs(now - iat) > this.iatToleranceSeconds) {
        return { isValid: false, jkt: '', error: 'invalid_iat' };
      }

      // exp check (must be present and exp - iat <= 120s)
      if (!payload.exp) {
        return { isValid: false, jkt: '', error: 'missing_exp' };
      }
      if (payload.exp - iat > 120) {
        return { isValid: false, jkt: '', error: 'invalid_exp' };
      }

      // ath check (if accessToken is provided)
      if (accessToken) {
        if (!payload.ath) {
          return { isValid: false, jkt: '', error: 'missing_ath' };
        }
        const hash = await jose.base64url.encode(
          new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(accessToken)))
        );
        if (payload.ath !== hash) {
          return { isValid: false, jkt: '', error: 'invalid_ath' };
        }
      }

      // jti check (replay protection)
      if (!payload.jti) {
        return { isValid: false, jkt: '', error: 'missing_jti' };
      }

      if (this.jtiStore) {
        const isUsed = await this.jtiStore.isUsed(payload.jti as string, clientId);
        if (isUsed) {
          return { isValid: false, jkt: '', error: 'jti_reused' };
        }
        
        const expiresAt = new Date((iat + this.iatToleranceSeconds) * 1000);
        await this.jtiStore.markUsed(payload.jti as string, clientId, expiresAt);
      }

      // nonce check
      if (expectedNonce && payload.nonce !== expectedNonce) {
        return { isValid: false, jkt: '', error: 'invalid_nonce' };
      }

      // jkt binding check
      const jkt = await jose.calculateJwkThumbprint(header.jwk as jose.JWK);
      if (expectedJkt && jkt !== expectedJkt) {
        return { isValid: false, jkt, error: 'DPoP jkt mismatch' };
      }

      return { isValid: true, jkt, payload };
    } catch (error: any) {
      return { isValid: false, jkt: '', error: error.code || error.message };
    }
  }
}
