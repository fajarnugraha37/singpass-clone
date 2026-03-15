import { type AuditFinding, type AuditorConfig, type AuthSessionState } from "../../utils/types.ts";
import { secureFetch } from "../../utils/http.ts";

export async function checkInvalidPkce(
  config: AuditorConfig,
  discoveryDoc: any,
  session: AuthSessionState
): Promise<AuditFinding> {
  const result: AuditFinding = {
    id: "SEC-002",
    title: "Invalid PKCE Verifier Rejection Check",
    status: "FAIL",
    finding: "Server accepted an invalid PKCE code_verifier",
    evidence: "",
  };

  if (!session.authorizationCode) {
    result.status = "MANUAL";
    result.finding = "Requires an authorization code to test invalid PKCE.";
    return result;
  }

  try {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code: session.authorizationCode,
      redirect_uri: config.redirectUri,
      client_id: config.clientId,
      code_verifier: "this-is-an-incorrect-verifier-1234567890",
    });

    if (config.clientAssertionType === 'client_secret') {
        body.append('client_secret', config.clientSecret || "");
    }

    const tokenUrl = discoveryDoc.token_endpoint;
    const response = await secureFetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (response.status === 400 || response.status === 401) {
      result.status = "PASS";
      result.finding = "Server correctly rejected invalid PKCE code_verifier.";
      return result;
    }

    result.evidence = await response.text();
    return result;
  } catch (error: any) {
    result.finding = `Invalid PKCE test error: ${error.message}`;
    return result;
  }
}
