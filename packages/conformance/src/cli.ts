import { parseArgs } from "util";
import { type AuditorConfig } from "./utils/types.ts";
import { runConformance } from "./runner.ts";
import { reportToConsole } from "./reporters/console.ts";
import { reportToJson } from "./reporters/json.ts";
import { reportToMarkdown } from "./reporters/markdown.ts";

function parseConfig() {
  const { values } = parseArgs({
    options: {
      target: { type: "string" },
      "client-id": { type: "string" },
      "client-secret": { type: "string" },
      "private-key": { type: "string" },
      "redirect-uri": { type: "string" },
      scopes: { type: "string", default: "openid" },
      "use-dpop": { type: "boolean", default: false },
      output: { type: "string", default: "console" },
      code: { type: "string" }, // Manual authorization code
    },
    strict: true,
  });

  if (!values.target) throw new Error("--target is required");
  if (!values["client-id"]) throw new Error("--client-id is required");
  if (!values["redirect-uri"]) throw new Error("--redirect-uri is required");

  let clientAssertionType: 'client_secret' | 'private_key_jwt' = 'client_secret';
  if (values["private-key"]) {
    clientAssertionType = 'private_key_jwt';
  }

  const config: AuditorConfig = {
    targetDiscoveryUrl: values.target,
    clientId: values["client-id"],
    clientAssertionType,
    clientSecret: values["client-secret"],
    clientPrivateKey: values["private-key"],
    redirectUri: values["redirect-uri"],
    requestedScopes: values.scopes.split(","),
    useDpop: !!values["use-dpop"],
  };

  return { config, output: values.output, code: values.code };
}

async function main() {
  try {
    const { config, output, code } = parseConfig();
    const report = await runConformance(config, code);
    
    switch (output) {
      case 'json':
        reportToJson(report);
        break;
      case 'markdown':
        reportToMarkdown(report);
        break;
      default:
        reportToConsole(report);
    }

    if (report.overallStatus === 'FAIL') {
      process.exit(1);
    }
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    process.exit(2);
  }
}

main();
