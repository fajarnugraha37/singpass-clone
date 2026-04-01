import * as jose from 'jose';

export interface NDIPort {
  pushAuthorizationRequest(clientId: string, payload: Record<string, any>, dpopKey: jose.GenerateKeyPairResult, dpopNonce?: string): Promise<{ request_uri: string; expires_in: number }>;
  exchangeToken(clientId: string, code: string, codeVerifier: string, dpopKey: jose.GenerateKeyPairResult, dpopNonce?: string): Promise<any>;
  getUserInfo(accessToken: string, dpopKey: jose.GenerateKeyPairResult): Promise<any>;
}
