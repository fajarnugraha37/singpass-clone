# Data Model: Unified HTTPS Architecture

## Filesystem Entities

This feature introduces infrastructure-level state managed on the filesystem.

### SSL Certificate Store

- **Path**: `apps/backend/.ssl/`
- **Description**: Secure directory for storing TLS credentials. This directory is excluded from version control.

| File | Type | Description |
|------|------|-------------|
| `server.key` | PEM (Private Key) | The private key for the TLS certificate. |
| `server.crt` | PEM (Certificate) | The self-signed (development) or CA-signed (production) TLS certificate. |

### Build Artifacts Integration

- **Path**: `apps/frontend/dist/`
- **Description**: The static output of the Astro build process, served by the Hono backend.

## State Transitions

### TLS Lifecycle

1. **Startup Check**: On backend initialization, the system checks for the existence of `server.key` and `server.crt`.
2. **Auto-Generation**: If missing, the `selfsigned` library is invoked to generate a new keypair and certificate valid for `localhost`.
3. **Persistence**: The generated assets are written to the `.ssl/` directory.
4. **Binding**: The Bun server instance on port 443 is initialized with these credentials.
