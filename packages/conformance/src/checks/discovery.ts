import { type AuditFinding, type AuditorConfig } from "../utils/types.ts";
import { secureFetch } from "../utils/http.ts";

export async function checkDiscovery(config: AuditorConfig): Promise<AuditFinding> {
  const result: AuditFinding = {
    id: "CH-001",
    title: "OIDC Discovery Endpoint Check",
    status: "FAIL",
    finding: "Could not fetch or validate discovery document",
    evidence: "",
  };

  try {
    const response = await secureFetch(config.targetDiscoveryUrl);
    if (!response.ok) {
      result.finding = `Discovery endpoint returned ${response.status}`;
      return result;
    }

    const doc = await response.json();
    result.evidence = JSON.stringify(doc, null, 2);

    const requiredEndpoints = [
      "authorization_endpoint",
      "token_endpoint",
      "userinfo_endpoint",
      "jwks_uri",
      "pushed_authorization_request_endpoint"
    ];

    const missing = requiredEndpoints.filter(e => !doc[e]);
    if (missing.length > 0) {
      result.finding = `Missing required endpoints: ${missing.join(", ")}`;
      return result;
    }

    result.status = "PASS";
    result.finding = "Discovery document is valid and contains all required endpoints.";
    return result;
  } catch (error: any) {
    result.finding = `Discovery error: ${error.message}`;
    return result;
  }
}
