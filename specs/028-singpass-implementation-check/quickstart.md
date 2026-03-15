# Quickstart: Singpass Implementation Conformance Auditor

## Setup

1. **Navigate to the package:**
   ```bash
   cd packages/conformance
   ```

2. **Install dependencies:**
   ```bash
   bun install
   ```

## Running the Auditor

Execute the conformance tool against your local running instance of the Singpass clone.

### Basic Run (Console Output)

```bash
bun run start \
  --target "http://localhost:3000/.well-known/openid-configuration" \
  --client-id "TEST_CLIENT_123" \
  --client-secret "TEST_SECRET" \
  --redirect-uri "http://localhost:8080/callback"
```

### Run with DPoP and Private Key JWT

```bash
bun run start \
  --target "http://localhost:3000/.well-known/openid-configuration" \
  --client-id "TEST_CLIENT_123" \
  --private-key "./keys/private.pem" \
  --redirect-uri "http://localhost:8080/callback" \
  --use-dpop true
```

### Output to Markdown

```bash
bun run start \
  --target "http://localhost:3000/.well-known/openid-configuration" \
  --client-id "TEST_CLIENT_123" \
  --client-secret "TEST_SECRET" \
  --redirect-uri "http://localhost:8080/callback" \
  --output markdown > report.md
```

## Running the Test Suite
The tool's own internal logic can be tested using standard Bun testing:
```bash
bun test
```
