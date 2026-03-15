import { type AuditorConfig, type AuditReport, type AuthSessionState, type AuditFinding } from "./utils/types.ts";
import { checkDiscovery } from "./checks/discovery.ts";
import { checkPar } from "./checks/par.ts";
import { checkTokenExchange } from "./checks/token.ts";
import { checkUserInfo } from "./checks/userinfo.ts";
import { checkReplayAttack } from "./checks/security/replay.ts";
import { checkInvalidPkce } from "./checks/security/invalid_token.ts";
import { checkMismatchedRedirect } from "./checks/security/redirect.ts";
import { checkClientConfig, checkServerLogs } from "./checks/config.ts";

export async function runConformance(config: AuditorConfig, manualCode?: string): Promise<AuditReport> {
  const session: AuthSessionState = {
    state: "",
    nonce: "",
    codeVerifier: "",
    codeChallenge: "",
    authorizationCode: manualCode,
  };

  const findings: AuditFinding[] = [];

  // 1. Config Check
  findings.push(await checkClientConfig(config));

  // 2. Logging Check (Manual)
  findings.push(await checkServerLogs());

  // 3. Discovery
  const discoveryFinding = await checkDiscovery(config);
  findings.push(discoveryFinding);

  if (discoveryFinding.status !== 'PASS') {
    return finalizeReport(config, findings);
  }

  const discoveryDoc = JSON.parse(discoveryFinding.evidence);

  // 4. Security: Mismatched Redirect
  const redirectFinding = await checkMismatchedRedirect(config, discoveryDoc);
  findings.push(redirectFinding);

  // 5. PAR
  const parFinding = await checkPar(config, discoveryDoc, session);
  findings.push(parFinding);

  if (parFinding.status !== 'PASS') {
    return finalizeReport(config, findings);
  }

  // If no manual code, we stop here and ask for it
  if (!session.authorizationCode) {
    findings.push({
      id: "CH-003",
      title: "Token Exchange & ID Token Validation Check",
      status: "MANUAL",
      finding: `Awaiting user login. Open: ${discoveryDoc.authorization_endpoint}?client_id=${config.clientId}&request_uri=${session.requestUri}`,
      evidence: "",
    });
    return finalizeReport(config, findings);
  }

  // 6. Token Exchange
  const tokenFinding = await checkTokenExchange(config, discoveryDoc, session);
  findings.push(tokenFinding);

  if (tokenFinding.status !== 'PASS') {
    return finalizeReport(config, findings);
  }

  // 7. Userinfo
  const userInfoFinding = await checkUserInfo(config, discoveryDoc, session);
  findings.push(userInfoFinding);

  // 8. Security Checks (requiring code)
  const replayFinding = await checkReplayAttack(config, discoveryDoc, session);
  findings.push(replayFinding);

  const invalidPkceFinding = await checkInvalidPkce(config, discoveryDoc, session);
  findings.push(invalidPkceFinding);

  return finalizeReport(config, findings);
}

function finalizeReport(config: AuditorConfig, checks: AuditFinding[]): AuditReport {
  const overallStatus = checks.some(c => c.status === 'FAIL') ? 'FAIL' : 
                        checks.some(c => c.status === 'MANUAL' || c.status === 'PARTIAL') ? 'PARTIAL' : 'PASS';

  return {
    timestamp: new Date().toISOString(),
    target: config.targetDiscoveryUrl,
    overallStatus,
    summary: overallStatus === 'PASS' ? "Conformance successful." : "Issues found during conformance.",
    topFindings: checks.filter(c => c.status === 'FAIL').slice(0, 3),
    checks,
  };
}
