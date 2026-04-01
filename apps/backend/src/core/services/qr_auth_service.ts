import { eq, and, gt } from 'drizzle-orm';
import { db } from '../../infra/database/client';
import { sessions, authSessions, qrSessions, users, serverKeys } from '../../infra/database/schema';
import type { NDIPort } from '../domain/ndi.port';
import { generatePKCE } from '../utils/pkce';
import { randomBytes } from 'node:crypto';
import * as jose from 'jose';

import type { UserInfoRepository } from '../domain/userinfo_repository';
import type { CryptoService } from '../domain/crypto_service';

export class QRAuthService {
  constructor(
    private ndiAdapter: NDIPort,
    private userinfoRepository: UserInfoRepository,
    private cryptoService: CryptoService
  ) {}

  /**
   * For the QR flow (RP role), we use an ephemeral DPoP key pair.
   * To align with the normal flow, we use the CryptoService to manage this.
   */
  private async getSessionDPoPKey(jkt?: string): Promise<jose.GenerateKeyPairResult> {
    // If we have a JKT, we would ideally retrieve it from a secure store.
    // For this mock implementation, we'll generate a fresh one if missing, 
    // or use the server's own key for simplicity if we want 100% alignment with "using the same resources".
    // However, DPoP keys should ideally be per-client.
    // Let's use the active server key as the DPoP key for our RP role to share resources.
    const { privateKey, publicKey } = await this.cryptoService.getActiveKey();
    return { privateKey, publicKey: publicKey as any };
  }

  async initQRSession(parentSessionId: string) {
    // 1. Resolve Client ID from the parent auth session
    const [parentSession] = await db.select().from(authSessions).where(eq(authSessions.id, parentSessionId)).limit(1);
    if (!parentSession) {
      throw new Error('Parent auth session not found');
    }

    const clientId = parentSession.clientId;

    // 2. Standard OIDC/FAPI setup
    const { verifier, challenge } = generatePKCE();
    const state = randomBytes(32).toString('base64url');
    const nonce = randomBytes(32).toString('base64url');
    
    // Use shared crypto resources for DPoP
    const keyPair = await this.getSessionDPoPKey();
    const dpopJkt = await this.cryptoService.calculateThumbprint(await jose.exportJWK(keyPair.publicKey));

    const parPayload = {
      response_type: 'code',
      scope: 'openid user.identity',
      redirect_uri: process.env.SINGPASS_REDIRECT_URI || '',
      state,
      nonce,
      code_challenge: challenge,
      code_challenge_method: 'S256',
      purpose: parentSession.purpose || 'QR Login',
      authentication_context_type: 'APP_AUTHENTICATION_DEFAULT',
    };

    // 3. Dynamic RP Identification using the NDI Adapter (now handles DPoP retry)
    const { request_uri, expires_in } = await this.ndiAdapter.pushAuthorizationRequest(clientId, parPayload, keyPair);

    const expiresAt = new Date(Date.now() + expires_in * 1000);

    const [session] = await db.insert(qrSessions).values({
      parentSessionId,
      clientId,
      state,
      nonce,
      codeVerifier: verifier,
      dpopJkt,
      requestUri: request_uri,
      status: 'PENDING',
      expiresAt,
    }).returning({ id: qrSessions.id });

    // Mock Authorization URL
    const issuer = process.env.OIDC_ISSUER || 'https://localhost';
    const authEndpoint = process.env.SINGPASS_AUTH_ENDPOINT || `${issuer}/authorize`;
    const qrUrl = `${authEndpoint}?client_id=${clientId}&request_uri=${request_uri}`;

    return {
      sessionId: session.id,
      qrUrl,
      expiresIn: expires_in,
      state,
    };
  }

  async getSessionStatus(sessionId: string) {
    const [session] = await db.select().from(qrSessions).where(eq(qrSessions.id, sessionId)).limit(1);

    if (!session) {
      return { status: 'ERROR' as const };
    }

    if (session.status === 'PENDING' && session.expiresAt < new Date()) {
      await db.update(qrSessions).set({ status: 'EXPIRED' }).where(eq(qrSessions.id, sessionId));
      return { status: 'EXPIRED' as const };
    }

    return {
      status: session.status as 'PENDING' | 'AUTHORIZED' | 'CANCELLED' | 'EXPIRED' | 'ERROR',
      redirectUrl: session.status === 'AUTHORIZED' ? '/dashboard' : undefined,
    };
  }

  async handleCallback(state: string, code?: string, error?: string) {
    const [session] = await db.select().from(qrSessions).where(eq(qrSessions.state, state)).limit(1);

    if (!session) {
      throw new Error('Invalid state: session not found');
    }

    if (error === 'user_cancelled' || error === 'access_denied') {
      await db.update(qrSessions).set({ status: 'CANCELLED' }).where(eq(qrSessions.id, session.id));
      return;
    }

    if (!code) {
      await db.update(qrSessions).set({ status: 'ERROR' }).where(eq(qrSessions.id, session.id));
      return;
    }

    // Exchange token using shared crypto resources
    try {
      const keyPair = await this.getSessionDPoPKey(session.dpopJkt || undefined);
      
      const tokenResponse = await this.ndiAdapter.exchangeToken(session.clientId, code, session.codeVerifier, keyPair);
      
      // 1. Decode ID Token to get User Identity (NRIC/sub)
      const decoded = jose.decodeJwt(tokenResponse.id_token);
      const sub = decoded.sub; 
      
      // 2. Resolve user in our local database
      const user = await this.userinfoRepository.getUserByNric(sub as string);
      if (!user) {
        throw new Error('User not found in local directory');
      }

      // 3. Update the PARENT OIDC Session (auth_sessions)
      if (session.parentSessionId) {
        await db.update(authSessions).set({
          userId: user.id,
          status: 'authenticated',
          updatedAt: new Date(),
        }).where(eq(authSessions.id, session.parentSessionId));
      }
      
      // 4. Update QR session status
      await db.update(qrSessions).set({ 
        status: 'AUTHORIZED', 
        authCode: code,
        idToken: tokenResponse.id_token 
      }).where(eq(qrSessions.id, session.id));

    } catch (err) {
      console.error('Token exchange failed in callback:', err);
      await db.update(qrSessions).set({ status: 'ERROR' }).where(eq(qrSessions.id, session.id));
      throw err;
    }
  }
}
