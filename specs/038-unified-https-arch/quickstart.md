# Quickstart: Unified HTTPS Architecture

## Prerequisites

- **Bun**: Ensure Bun is installed (v1.1+).
- **Admin/Root Privileges**: Listening on ports 80 and 443 requires elevated permissions on many operating systems. For local development, you may need to run `sudo bun run dev` or run your terminal as Administrator.

## Local Development Flow

### 1. Unified Startup

To start both the API and the Frontend on ports 80/443:

```bash
# In the repository root
bun run dev
```

The system will:
1.  Check for `.ssl/server.key` and `.ssl/server.crt`.
2.  Automatically generate them if missing.
3.  Start the HTTPS server on port 443.
4.  Start the HTTP redirect server on port 80.
5.  Serve frontend assets from `apps/frontend/dist`.

### 2. Accessing the Platform

- **HTTPS (Primary)**: `https://localhost` (or `https://localhost:443`)
- **HTTP (Redirect)**: `http://localhost` (redirects to HTTPS)

## Deployment

In production, ensure that:
1.  Port 80 and 443 are exposed.
2.  The `.ssl/` directory contains your actual CA-signed certificates (if not using an external proxy/ingress).
3.  The frontend has been built: `bun run build:frontend`.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT_HTTPS` | 443 | Port for the secure server. |
| `PORT_HTTP` | 80 | Port for the HTTP upgrade server. |
| `SSL_DIR` | `./.ssl` | Directory for certificates. |
