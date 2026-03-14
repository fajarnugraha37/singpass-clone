import * as jose from 'jose';

export interface ClientConfig {
  clientId: string;
  clientName: string;
  appType: 'Login' | 'Myinfo';
  redirectUris?: string[];
  jwksUri?: string;
  jwks?: {
    keys: jose.JWK[];
  };
}

export interface ClientRegistry {
  getClientConfig(clientId: string): Promise<ClientConfig | null>;
}
