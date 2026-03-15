import { type AuditReport } from "../utils/types.ts";

export function reportToJson(report: AuditReport): void {
  console.log(JSON.stringify(report, null, 2));
}
