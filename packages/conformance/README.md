# @vibe-auth/conformance

Singpass Implementation Conformance Auditor.

This package provides a small CLI that runs a set of automated (and a few manual) checks against an OIDC/Singpass-compatible implementation, producing a conformance-style report.

## Requirements

- Runtime: `bun`

## Usage

From `packages/conformance`:

```sh
bun run src/cli.ts \
  --target "https://<issuer>/.well-known/openid-configuration" \
  --client-id "<32-char-client-id>" \
  --client-secret "<client-secret>" \
  --redirect-uri "https://your-app/callback" \
  --scopes "openid" \
  --output console
```

### Manual login flow (authorization code)

Some checks require an authorization code.

1. Run without `--code`.
2. The tool prints a URL to open in a browser (authorization endpoint with `request_uri=...`).
3. Complete login/consent and capture the returned authorization code.
4. Re-run with `--code "<authorization-code>"`.

```sh
bun run src/cli.ts \
  --target "https://<issuer>/.well-known/openid-configuration" \
  --client-id "<32-char-client-id>" \
  --client-secret "<client-secret>" \
  --redirect-uri "https://your-app/callback" \
  --scopes "openid" \
  --code "<authorization-code>" \
  --output markdown
```

## CLI options

- `--target`: OIDC discovery URL (required)
- `--client-id`: OAuth client id (required)
- `--client-secret`: client secret (required for current implementation)
- `--private-key`: switches to `private_key_jwt` mode (currently not used by requests)
- `--redirect-uri`: redirect URI (required)
- `--scopes`: comma-separated scopes (default: `openid`)
- `--use-dpop`: flag for DPoP support (currently not wired into requests)
- `--output`: `console` | `json` | `markdown` (default: `console`)
- `--code`: authorization code for token exchange + security checks

## What it checks

The auditor produces an `AuditReport` with a list of findings (`PASS` | `PARTIAL` | `FAIL` | `MANUAL`).

- `CFG-001`: Client configuration strictness (redirect URI wildcards, client id format, MyInfo scope warning)
- `LOG-001`: Server-side logging verification (manual checklist)
- `CH-001`: OIDC discovery document presence + required endpoints
- `SEC-003`: Redirect URI mismatch rejection during PAR
- `CH-002`: Pushed Authorization Request (PAR)
- `CH-003`: Token exchange + ID token signature/claims validation
- `CH-004`: Userinfo endpoint response validation
- `SEC-001`: Authorization code replay protection
- `SEC-002`: Invalid PKCE verifier rejection

## Output

- `console`: human-readable console output
- `json`: JSON-serialized `AuditReport`
- `markdown`: Markdown report printed to stdout

## Development

```sh
bun test
```
