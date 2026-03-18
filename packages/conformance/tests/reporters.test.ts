import { describe, it, expect, spyOn } from "bun:test";
import { type AuditReport } from "../src/utils/types.ts";
import { reportToConsole } from "../src/reporters/console.ts";
import { reportToJson } from "../src/reporters/json.ts";
import { reportToMarkdown } from "../src/reporters/markdown.ts";

const mockReport: AuditReport = {
  timestamp: new Date().toISOString(),
  target: "https://localhost",
  overallStatus: "PASS",
  summary: "All good",
  topFindings: [],
  checks: [
    {
      id: "CH-001",
      title: "Discovery Check",
      status: "PASS",
      finding: "Found it",
      evidence: "{}"
    }
  ]
};

describe("Reporters", () => {
  it("should output console report", () => {
    const spy = spyOn(console, "log");
    reportToConsole(mockReport);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("should output JSON report", () => {
    const spy = spyOn(console, "log");
    reportToJson(mockReport);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("should output Markdown report", () => {
    const spy = spyOn(console, "log");
    reportToMarkdown(mockReport);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
