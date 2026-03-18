# Contract: Singpass Client Remediation

## Endpoint: PAR Registration (`POST /api/par`)

### Request Validation (Updated)

The `parRequestSchema` in `packages/shared/src/config.ts` will be updated with the following refinements:

| Parameter | Validation Rule | Error on Failure |
|-----------|-----------------|------------------|
| `redirect_uri` | Must NOT contain an IP address. Must be HTTPS (except for localhost in non-prod). | `400 Bad Request` - `invalid_request` |
| `scope` | Must NOT contain scopes not authorized for the client. | `400 Bad Request` - `invalid_scope` |

### Business Logic (OIDC Invariants)

| Logic Step | Description | Error on Failure |
|------------|-------------|------------------|
| **Client Activation** | Check `isActive` status of the client. | `401 Unauthorized` - `unauthorized_client` |
| **Scope Intersection**| Compare requested scopes against `allowedScopes`. | `400 Bad Request` - `invalid_scope` |
| **Agreement Status** | Check if `hasAcceptedAgreement` is true. | `401 Unauthorized` - `unauthorized_client` |

## Domain Interface: ClientConfig (Updated)

```typescript
export interface ClientConfig {
  clientId: string;
  clientName: string;
  appType: 'Login' | 'Myinfo';
  redirectUris?: string[];
  jwks?: JWKS;
  jwksUri?: string;
  // Remediation
  allowedScopes: string[];
  isActive: boolean;
  uen: string;
  siteUrl?: string;
  appDescription?: string;
  supportEmails?: string[];
  hasAcceptedAgreement: boolean;
}
```
