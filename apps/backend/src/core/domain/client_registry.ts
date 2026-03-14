import * as jose from 'jose';

export interface ClientConfig {
  clientId: string;
  clientName: string;
  redirectUris?: string[];
  jwksUri?: string;
  jwks?: {
    keys: jose.JWK[];
  };
}

export interface ClientRegistry {
  getClientConfig(clientId: string): Promise<ClientConfig | null>;
}
