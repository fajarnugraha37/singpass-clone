import { type AuditFinding, type AuditorConfig } from "../utils/types.ts";

export async function checkClientConfig(config: AuditorConfig): Promise<AuditFinding> {
  const result: AuditFinding = {
    id: "CFG-001",
    title: "Client Configuration Strictness Check",
    status: "PASS",
    finding: "Client configuration adheres to Singpass strictness requirements.",
    evidence: "",
  };

  const findings: string[] = [];

  // 1. Exact match redirect URI
  if (config.redirectUri.includes("*")) {
    findings.push("Redirect URI contains wildcards, which are forbidden.");
    result.status = "FAIL";
  }

  // 2. Client ID length/format
  const clientIdRegex = /^[a-zA-Z0-9]{32}$/;
  if (!clientIdRegex.test(config.clientId)) {
    findings.push("Client ID must be exactly 32 alphanumeric characters as per Singpass specifications.");
    result.status = "PARTIAL";
  }

  // 3. MyInfo scopes data minimization (Manual warning)
  if (config.requestedScopes.some(s => s.startsWith("myinfo"))) {
    findings.push("MyInfo scopes detected. Ensure data minimization and consent UX are manually verified.");
    if (result.status === "PASS") result.status = "MANUAL";
  }

  if (findings.length > 0) {
    result.finding = findings.join(" ");
  }

  result.evidence = JSON.stringify({
    clientId: config.clientId,
    redirectUri: config.redirectUri,
    scopes: config.requestedScopes
  }, null, 2);

  return result;
}

/**
 * Provides a manual checklist for server-side logging verification.
 */
export async function checkServerLogs(): Promise<AuditFinding> {
  return {
    id: "LOG-001",
    title: "Server-side Logging Verification (Manual)",
    status: "MANUAL",
    finding: "Administrators must manually verify that the target clone logs adequate metadata (client_id, state, nonce, request_uri) without leaking raw secrets.",
    evidence: "Manual review required in the target server's log environment.",
    referenceUrl: "https://api.id.gov.sg/docs/singpass-server/05-userinfo-endpoint" // Example reference
  };
}
