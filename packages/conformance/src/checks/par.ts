import { type AuditFinding, type AuditorConfig, type AuthSessionState } from "../utils/types.ts";
import { secureFetch } from "../utils/http.ts";
import { generatePkce } from "../utils/crypto.ts";

export async function checkPar(
  config: AuditorConfig, 
  discoveryDoc: any, 
  session: AuthSessionState
): Promise<AuditFinding> {
  const result: AuditFinding = {
    id: "CH-002",
    title: "Pushed Authorization Request (PAR) Check",
    status: "FAIL",
    finding: "PAR request failed or rejected",
    evidence: "",
  };

  try {
    const { verifier, challenge } = await generatePkce();
    session.codeVerifier = verifier;
    session.codeChallenge = challenge;
    session.state = Math.random().toString(36).substring(7);
    session.nonce = Math.random().toString(36).substring(7);

    const body = new URLSearchParams({
      response_type: 'code',
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: config.requestedScopes.join(" "),
      state: session.state,
      nonce: session.nonce,
      code_challenge: challenge,
      code_challenge_method: 'S256',
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

    if (!response.ok) {
      result.finding = `PAR endpoint returned ${response.status}`;
      result.evidence = await response.text();
      return result;
    }

    const data = await response.json();
    result.evidence = JSON.stringify(data, null, 2);

    if (!data.request_uri || !data.expires_in) {
      result.finding = "PAR response missing required fields: request_uri or expires_in";
      return result;
    }

    session.requestUri = data.request_uri;
    result.status = "PASS";
    result.finding = "PAR endpoint successfully accepted the request and returned a request_uri.";
    return result;
  } catch (error: any) {
    result.finding = `PAR error: ${error.message}`;
    return result;
  }
}
