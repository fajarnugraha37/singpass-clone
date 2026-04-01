import * as jose from 'jose';
import type { NDIPort } from '../../core/domain/ndi.port';
import type { ServerKeyManager } from '../../core/domain/key_manager';

export class SingpassNDIAdapter implements NDIPort {
  private parEndpoint: string;
  private tokenEndpoint: string;
  private userinfoEndpoint: string;

  constructor(
    private keyManager: ServerKeyManager
  ) {
    const issuer = process.env.OIDC_ISSUER || 'https://localhost';
    this.parEndpoint = process.env.SINGPASS_PAR_ENDPOINT || `${issuer}/par`;
    this.tokenEndpoint = process.env.SINGPASS_TOKEN_ENDPOINT || `${issuer}/token`;
    this.userinfoEndpoint = process.env.SINGPASS_USERINFO_ENDPOINT || `${issuer}/userinfo`;
  }

  private async createClientAssertion(clientId: string, audience: string): Promise<string> {
    const { id, privateKey } = await this.keyManager.getActiveKey();
    
    return await new jose.SignJWT({})
      .setProtectedHeader({ alg: 'ES256', kid: id, typ: 'JWT' })
      .setIssuer(clientId)
      .setSubject(clientId)
      .setAudience(audience)
      .setIssuedAt()
      .setExpirationTime('2m')
      .setJti(crypto.randomUUID())
      .sign(privateKey);
  }

  private async generateDPoPProof(method: string, url: string, dpopKey: jose.GenerateKeyPairResult, accessToken?: string, nonce?: string): Promise<string> {
    const payload: Record<string, any> = {
      htm: method,
      htu: url,
    };

    if (accessToken) {
      const accessTokenHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(accessToken));
      payload.ath = jose.base64url.encode(new Uint8Array(accessTokenHash));
    }

    if (nonce) {
      payload.nonce = nonce;
    }

    return await new jose.SignJWT(payload)
      .setProtectedHeader({
        alg: 'ES256',
        typ: 'dpop+jwt',
        jwk: await jose.exportJWK(dpopKey.publicKey),
      })
      .setIssuedAt()
      .setJti(crypto.randomUUID())
      .sign(dpopKey.privateKey);
  }

  async pushAuthorizationRequest(clientId: string, payload: Record<string, any>, dpopKey: jose.GenerateKeyPairResult, dpopNonce?: string): Promise<{ request_uri: string; expires_in: number }> {
    const clientAssertion = await this.createClientAssertion(clientId, this.parEndpoint);
    const dpopProof = await this.generateDPoPProof('POST', this.parEndpoint, dpopKey, undefined, dpopNonce);
    const dpopJkt = await jose.calculateJwkThumbprint(await jose.exportJWK(dpopKey.publicKey));

    const body = new URLSearchParams({
      ...payload,
      client_id: clientId,
      client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      client_assertion: clientAssertion,
      dpop_jkt: dpopJkt, // MANDATORY for FAPI 2.0 JKT binding
    });

    const response = await fetch(this.parEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'DPoP': dpopProof,
      },
      body: body.toString(),
    });

    if (response.status === 400 || response.status === 401) {
      const serverNonce = response.headers.get('DPoP-Nonce');
      if (serverNonce && !dpopNonce) {
        return this.pushAuthorizationRequest(clientId, payload, dpopKey, serverNonce);
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Singpass PAR failed: ${response.status} ${errorText}`);
    }

    return await response.json();
  }

  async exchangeToken(clientId: string, code: string, codeVerifier: string, dpopKey: jose.GenerateKeyPairResult, dpopNonce?: string): Promise<any> {
    const clientAssertion = await this.createClientAssertion(clientId, this.tokenEndpoint);
    const dpopProof = await this.generateDPoPProof('POST', this.tokenEndpoint, dpopKey, undefined, dpopNonce);

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.SINGPASS_REDIRECT_URI || '',
      code_verifier: codeVerifier,
      client_id: clientId,
      client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      client_assertion: clientAssertion,
    });

    const response = await fetch(this.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'DPoP': dpopProof,
      },
      body: body.toString(),
    });

    if (response.status === 400 || response.status === 401) {
      const serverNonce = response.headers.get('DPoP-Nonce');
      if (serverNonce && !dpopNonce) {
        return this.exchangeToken(clientId, code, codeVerifier, dpopKey, serverNonce);
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Singpass Token exchange failed: ${response.status} ${errorText}`);
    }

    return await response.json();
  }

  async getUserInfo(accessToken: string, dpopKey: jose.GenerateKeyPairResult): Promise<any> {
    // UserInfo request also needs DPoP in FAPI 2.0
    const dpopProof = await this.generateDPoPProof('GET', this.userinfoEndpoint, dpopKey, accessToken);

    const response = await fetch(this.userinfoEndpoint, {
      method: 'GET',
      headers: {
        'Authorization': `DPoP ${accessToken}`,
        'DPoP': dpopProof,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Singpass UserInfo failed: ${response.status} ${errorText}`);
    }

    return await response.json();
  }
}
