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
  // Remediation fields
  allowedScopes: string[];
  isActive: boolean;
  uen: string;
  siteUrl?: string;
  appDescription?: string;
  supportEmails?: string[];
  environment: 'Staging' | 'Production';
  hasAcceptedAgreement: boolean;
}

export interface ClientRegistry {
  getClientConfig(clientId: string): Promise<ClientConfig | null>;
}
