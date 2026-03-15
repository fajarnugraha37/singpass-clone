import { type AuditReport, type AuditFinding } from "../utils/types.ts";

export function reportToConsole(report: AuditReport): void {
  console.log(`\nConformance Report: ${report.target}`);
  console.log(`Overall Status: ${report.overallStatus}`);
  console.log(`Timestamp: ${report.timestamp}\n`);
  
  console.log(`Summary:\n${report.summary}\n`);

  console.log("Top Findings:");
  report.topFindings.forEach(f => printFinding(f));

  console.log("\nAll Checks:");
  report.checks.forEach(f => printFinding(f));
}

function printFinding(f: AuditFinding): void {
  const statusColor = f.status === 'PASS' ? '\x1b[32m' : f.status === 'FAIL' ? '\x1b[31m' : '\x1b[33m';
  const resetColor = '\x1b[0m';
  console.log(`[${statusColor}${f.status}${resetColor}] ${f.id}: ${f.title}`);
  if (f.status !== 'PASS') {
    console.log(`  Finding: ${f.finding}`);
    if (f.remediation) console.log(`  Remediation: ${f.remediation}`);
  }
}
