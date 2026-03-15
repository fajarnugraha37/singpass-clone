import { type AuditFinding, type AuditorConfig, type AuthSessionState } from "../../utils/types.ts";
import { secureFetch } from "../../utils/http.ts";

export async function checkMismatchedRedirect(
  config: AuditorConfig,
  discoveryDoc: any
): Promise<AuditFinding> {
  const result: AuditFinding = {
    id: "SEC-003",
    title: "Redirect URI Mismatch Check",
    status: "FAIL",
    finding: "PAR endpoint accepted a mismatched redirect_uri",
    evidence: "",
  };

  try {
    const body = new URLSearchParams({
      response_type: 'code',
      client_id: config.clientId,
      redirect_uri: "http://attacker-controlled.com/callback", // Mismatched
      scope: config.requestedScopes.join(" "),
    });

    if (config.clientAssertionType === 'client_secret') {
        body.append('client_secret', config.clientSecret || "");
    }

    const parUrl = discoveryDoc.pushed_authorization_request_endpoint;
    const response = await secureFetch(parUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (response.status === 400 || response.status === 401) {
      result.status = "PASS";
      result.finding = "Server correctly rejected mismatched redirect_uri during PAR.";
      return result;
    }

    result.evidence = await response.text();
    return result;
  } catch (error: any) {
    result.finding = `Redirect mismatch test error: ${error.message}`;
    return result;
  }
}
