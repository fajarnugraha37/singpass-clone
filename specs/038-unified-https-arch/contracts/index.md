# Contracts: Unified HTTPS Origin

## Infrastructure Contract

This feature establishes a unified secure origin as the single point of entry for the platform.

### Standard Origin

- **Protocol**: HTTPS
- **Port**: 443
- **Hostname**: localhost (Development) | Configured Domain (Production)

### Upgrade Contract

- **Protocol**: HTTP
- **Port**: 80
- **Action**: 301/302 Redirect to HTTPS standard origin.

### Resource Mapping Contract

- **Prefix**: /api/* -> API service routes.
- **Prefix**: /* (excluding /api) -> Astro frontend static assets.
