# Data Model: SDP Compliance Fixes

## Domain Entities

### ClientConfig (Extended)
Represents a registered OIDC client in the Singpass ecosystem.

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `clientId` | `string` | Unique OIDC client identifier | Required, Unique |
| `clientName` | `string` | Display name of the application | Required (FR-001) |
| `jwksUri` | `string?` | URI for client public keys | Valid URL, No IP (FR-002, FR-004) |
| `jwks` | `JWKS?` | Static public keys | Either `jwks` or `jwksUri` REQUIRED |
| `allowedScopes`| `string[]`| Pre-approved OIDC/Myinfo scopes | Required (FR-003) |
| `appDescription`| `string` | Purpose of the application | Required (FR-005) |
| `siteUrl` | `string` | Home page of the application | Valid URL, No IP (FR-004, FR-005) |
| `supportEmails`| `string[]`| Contact emails for support | Valid emails (FR-005) |
| `environment` | `enum` | Deployment stage | 'Staging' \| 'Production' (FR-006) |
| `redirectUris` | `string[]`| Authorized callback URLs | Valid URLs, No IP (FR-004) |

### UserAccountLink
Represents a link between a User and a Client (for test account tracking).

| Field | Type | Description |
|-------|------|-------------|
| `userId` | `string` | Internal user identifier |
| `clientId` | `string` | Associated client identifier |
| `linkedAt` | `number` | Timestamp of linkage |

## Database Schema (SQLite/Drizzle)

### Table: `clients`
```typescript
export const clients = sqliteTable('clients', {
  clientId: text('client_id').primaryKey(),
  clientName: text('client_name').notNull(),
  jwksUri: text('jwks_uri'),
  jwks: text('jwks', { mode: 'json' }), // JSON-encoded JWKS
  allowedScopes: text('allowed_scopes', { mode: 'json' }).notNull(), // JSON array
  appDescription: text('app_description').notNull(),
  siteUrl: text('site_url').notNull(),
  supportEmails: text('support_emails', { mode: 'json' }).notNull(), // JSON array
  environment: text('environment', { enum: ['Staging', 'Production'] }).notNull(),
  redirectUris: text('redirect_uris', { mode: 'json' }).notNull(), // JSON array
});
```

### Table: `user_account_links`
```typescript
export const userAccountLinks = sqliteTable('user_account_links', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull(),
  clientId: text('client_id').notNull(),
  linkedAt: integer('linked_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  idx_client_user: uniqueIndex('idx_client_user').on(table.clientId, table.userId),
}));
```

## State Transitions & Validation Rules
- **Configuration Validation**: During client creation/update, reject any `redirect_uri` or `site_url` matching the IP regex.
- **Scope Validation**: During PAR request, check `request.scope` against `client.allowedScopes`.
- **Account Limit**: In 'Staging', before creating a `UserAccountLink`, count records where `clientId = X`. If `>= 100`, reject with `PRECONDITION_FAILED`.
