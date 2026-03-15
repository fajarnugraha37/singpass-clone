import { type AuditReport, type AuditFinding } from "../utils/types.ts";

export function reportToMarkdown(report: AuditReport): void {
  console.log(`# Conformance Report: ${report.target}\n`);
  console.log(`**Overall Status**: ${report.overallStatus}\n`);
  console.log(`**Timestamp**: ${report.timestamp}\n`);
  
  console.log(`## Summary\n${report.summary}\n`);

  console.log(`## Top Findings\n`);
  report.topFindings.forEach(f => printMarkdownFinding(f));

  console.log(`## All Checks\n`);
  report.checks.forEach(f => printMarkdownFinding(f));
}

function printMarkdownFinding(f: AuditFinding): void {
  const emoji = f.status === 'PASS' ? '✅' : f.status === 'FAIL' ? '❌' : '⚠️';
  console.log(`### ${emoji} ${f.status} - ${f.id}: ${f.title}`);
  console.log(`**Finding**: ${f.finding}\n`);
  if (f.evidence) {
    console.log(`**Evidence**:\n\`\`\`json\n${f.evidence}\n\`\`\`\n`);
  }
  if (f.remediation) {
    console.log(`**Remediation**: ${f.remediation}\n`);
  }
  if (f.referenceUrl) {
    console.log(`**Reference**: [${f.referenceUrl}](${f.referenceUrl})\n`);
  }
}
