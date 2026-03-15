import { type AuditFinding, type AuditorConfig, type AuthSessionState } from "../utils/types.ts";
import { secureFetch } from "../utils/http.ts";
import { validateIdToken, decodeJwt } from "../utils/crypto.ts";

export async function checkTokenExchange(
  config: AuditorConfig,
  discoveryDoc: any,
  session: AuthSessionState
): Promise<AuditFinding> {
  const result: AuditFinding = {
    id: "CH-003",
    title: "Token Exchange & ID Token Validation Check",
    status: "FAIL",
    finding: "Token exchange failed or ID token invalid",
    evidence: "",
  };

  if (!session.authorizationCode) {
    result.status = "MANUAL";
    result.finding = "Requires an authorization code. Please provide --code after user login.";
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
    const response = await secureFetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (!response.ok) {
      result.finding = `Token endpoint returned ${response.status}`;
      result.evidence = await response.text();
      return result;
    }

    const data = await response.json();
    result.evidence = JSON.stringify(data, null, 2);

    if (!data.id_token) {
      result.finding = "Token response missing id_token";
      return result;
    }

    session.idToken = data.id_token;
    session.accessToken = data.access_token;

    // Validate ID Token
    await validateIdToken(
      data.id_token,
      discoveryDoc.jwks_uri,
      discoveryDoc.issuer,
      config.clientId,
      session.nonce
    );

    result.status = "PASS";
    result.finding = "Token exchange successful and ID token signature/claims are valid.";
    return result;
  } catch (error: any) {
    result.finding = `Token exchange error: ${error.message}`;
    return result;
  }
}
