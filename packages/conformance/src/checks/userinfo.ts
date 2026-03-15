import { type AuditFinding, type AuditorConfig, type AuthSessionState } from "../utils/types.ts";
import { secureFetch } from "../utils/http.ts";

export async function checkUserInfo(
  config: AuditorConfig,
  discoveryDoc: any,
  session: AuthSessionState
): Promise<AuditFinding> {
  const result: AuditFinding = {
    id: "CH-004",
    title: "Userinfo Endpoint Check",
    status: "FAIL",
    finding: "Userinfo request failed",
    evidence: "",
  };

  if (!session.accessToken) {
    result.status = "MANUAL";
    result.finding = "Requires an access token. Ensure token exchange has completed successfully.";
    return result;
  }

  try {
    const userInfoUrl = discoveryDoc.userinfo_endpoint;
    const response = await secureFetch(userInfoUrl, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${session.accessToken}` 
      },
    });

    if (!response.ok) {
      result.finding = `Userinfo endpoint returned ${response.status}`;
      result.evidence = await response.text();
      return result;
    }

    const data = await response.json();
    result.evidence = JSON.stringify(data, null, 2);

    if (!data.sub) {
      result.finding = "Userinfo response missing sub claim";
      return result;
    }

    result.status = "PASS";
    result.finding = "Userinfo request successful and returned expected identity claims.";
    return result;
  } catch (error: any) {
    result.finding = `Userinfo error: ${error.message}`;
    return result;
  }
}
