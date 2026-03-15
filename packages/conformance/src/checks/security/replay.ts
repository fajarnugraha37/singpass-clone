import { type AuditFinding, type AuditorConfig, type AuthSessionState } from "../../utils/types.ts";
import { secureFetch } from "../../utils/http.ts";

export async function checkReplayAttack(
  config: AuditorConfig,
  discoveryDoc: any,
  session: AuthSessionState
): Promise<AuditFinding> {
  const result: AuditFinding = {
    id: "SEC-001",
    title: "Authorization Code Replay Protection Check",
    status: "FAIL",
    finding: "Server allowed replaying the same authorization code",
    evidence: "",
  };

  if (!session.authorizationCode) {
    result.status = "MANUAL";
    result.finding = "Requires an authorization code to test replay.";
    return result;
  }

  try {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code: session.authorizationCode,
      redirect_uri: config.redirectUri,
      client_id: config.clientId,
      code_verifier: session.codeVerifier,
    });

    if (config.clientAssertionType === 'client_secret') {
        body.append('client_secret', config.clientSecret || "");
    }

    const tokenUrl = discoveryDoc.token_endpoint;
    // We already used the code once in CH-003, so this second attempt should fail.
    const response = await secureFetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (response.status === 400 || response.status === 401) {
      result.status = "PASS";
      result.finding = "Server correctly rejected replayed authorization code.";
      return result;
    }

    result.evidence = await response.text();
    return result;
  } catch (error: any) {
    result.finding = `Replay test error: ${error.message}`;
    return result;
  }
}
