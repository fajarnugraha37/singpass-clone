# CLI Contract: Auditor Tool

The Singpass Implementation Conformance Auditor will be exposed as a CLI tool within the monorepo (`packages/conformance`).

## Command Interface

```bash
bun run start [options]
```

### Options

| Flag | Description | Default | Required |
|------|-------------|---------|----------|
| `--target` | Discovery URL of the target Singpass clone | N/A | Yes |
| `--client-id` | Client ID configured in the target | N/A | Yes |
| `--client-secret` | Client secret (if using client_secret_post/basic) | N/A | No |
| `--private-key` | Path to PEM/JWK file for `private_key_jwt` | N/A | No |
| `--redirect-uri` | The redirect URI configured for the client | N/A | Yes |
| `--scopes` | Comma-separated list of scopes to request | `openid` | No |
| `--use-dpop` | Enable DPoP bound tokens testing | `false` | No |
| `--output` | Format of the report (`json`, `markdown`, `console`) | `console` | No |

### Output

Based on the `--output` flag:
- `console`: Pretty-printed console output with colors for PASS/FAIL.
- `json`: Prints raw JSON of the `AuditReport` data model.
- `markdown`: Prints a markdown-formatted report.

### Exit Codes
- `0`: Overall status is PASS or PARTIAL (warnings).
- `1`: Overall status is FAIL (one or more Critical/High issues).
- `2`: Tool configuration or execution error.
