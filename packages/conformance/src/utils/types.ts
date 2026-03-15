export interface AuditorConfig {
  targetDiscoveryUrl: string;
  clientId: string;
  clientAssertionType: 'client_secret' | 'private_key_jwt';
  clientSecret?: string;
  clientPrivateKey?: string; // PEM/JWK format
  redirectUri: string;
  requestedScopes: string[];
  useDpop: boolean;
  myinfoConfig?: MyInfoVerificationConfig;
}

export interface MyInfoVerificationConfig {
  // Add MyInfo specific config fields if needed
}

export interface AuditReport {
  timestamp: string; // ISO 8601
  target: string;
  overallStatus: 'PASS' | 'PARTIAL' | 'FAIL';
  summary: string;
  topFindings: AuditFinding[]; // up to 3
  checks: AuditFinding[];
}

export interface AuditFinding {
  id: string; // e.g., CH-001
  title: string;
  status: 'PASS' | 'PARTIAL' | 'FAIL' | 'MANUAL';
  finding: string;
  evidence: string; // JSON stringified data, headers, or decoded tokens
  remediation?: string;
  referenceUrl?: string;
}

export interface AuthSessionState {
  state: string;
  nonce: string;
  codeVerifier: string;
  codeChallenge: string;
  requestUri?: string;
  authorizationCode?: string;
  accessToken?: string;
  idToken?: string;
  dpopNonce?: string;
}
