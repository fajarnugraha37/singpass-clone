import { sql } from 'drizzle-orm';
import { text, integer, sqliteTable, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  nric: text('nric').unique(),
  name: text('name').notNull(),
  email: text('email').unique(),
  mobileno: text('mobileno'),
  uen: text('uen'), // Associated Business Entity (US4 Compliance)
  accountType: text('account_type').default('standard'),
  passwordHash: text('password_hash'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const developers = sqliteTable('developers', (t) => ({
  id: t.text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: t.text('email').unique().notNull(),
  role: t.text('role').default('developer').notNull(),
  status: t.text('status').default('active').notNull(),
  createdAt: t.integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: t.integer('updated_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
}));

export const otpCodes = sqliteTable('otp_codes', (t) => ({
  id: t.text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: t.text('email').notNull(),
  code: t.text('code').notNull(),
  expiresAt: t.integer('expires_at', { mode: 'timestamp' }).notNull(),
  used: t.integer('used', { mode: 'boolean' }).default(false).notNull(),
  createdAt: t.integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
}));

export const emailLog = sqliteTable('email_log', (t) => ({
  id: t.text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  recipient: t.text('recipient').notNull(),
  subject: t.text('subject').notNull(),
  body: t.text('body').notNull(),
  sentAt: t.integer('sent_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
}));

export const clients = sqliteTable('clients', (t) => ({
  id: t.text('id').primaryKey(), // Using client_id
  developerId: t.text('developer_id').references(() => developers.id),
  clientSecret: t.text('client_secret'), // Hashed secret
  name: t.text('name').notNull(),
  appType: t.text('app_type').notNull(), // 'Login' or 'Myinfo'
  uen: t.text('uen').notNull(),
  isActive: t.integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  allowedScopes: t.text('allowed_scopes', { mode: 'json' }).notNull(), // JSON Array
  redirectUris: t.text('redirect_uris', { mode: 'json' }).notNull(), // JSON Array
  jwks: t.text('jwks', { mode: 'json' }), // JSON Object
  jwksUri: t.text('jwks_uri'),
  siteUrl: t.text('site_url'),
  description: t.text('description'),
  supportEmails: t.text('support_emails', { mode: 'json' }), // JSON Array
  environment: t.text('environment').default('Staging').notNull(),
  agreementAccepted: t.integer('agreement_accepted', { mode: 'boolean' }).default(false).notNull(),
  deletedAt: t.integer('deleted_at', { mode: 'timestamp' }),
  createdAt: t.integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: t.integer('updated_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
}));

export const userAccountLinks = sqliteTable('user_account_links', (t) => ({
  id: t.integer('id').primaryKey({ autoIncrement: true }),
  userId: t.text('user_id').notNull(),
  clientId: t.text('client_id').notNull(),
  linkedAt: t.integer('linked_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
}));

export const myinfoProfiles = sqliteTable('myinfo_profiles', (t) => ({
  id: t.text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: t.text('user_id').references(() => users.id).notNull(),
  data: t.text('data', { mode: 'json' }).notNull(),
  updatedAt: t.integer('updated_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
}));

export const sessions = sqliteTable('sessions', (t) => ({
  id: t.text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: t.text('user_id').references(() => users.id),
  clientId: t.text('client_id').references(() => clients.id),
  scopes: t.text('scopes', { mode: 'json' }),
  dpopJkt: t.text('dpop_jkt'),
  loa: t.integer('loa').default(0).notNull(),
  amr: t.text('amr'), // Stringified JSON array
  isAuthenticated: t.integer('is_authenticated', { mode: 'boolean' }).default(false).notNull(),
  expiresAt: t.integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: t.integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
}));

export const parRequests = sqliteTable('par_requests', (t) => ({
  id: t.integer('id').primaryKey({ autoIncrement: true }),
  requestUri: t.text('request_uri').unique().notNull(),
  clientId: t.text('client_id').notNull(),
  purpose: t.text('purpose').notNull().default('General Authentication'),
  dpopJkt: t.text('dpop_jkt'),
  payload: t.text('payload', { mode: 'json' }).notNull(),
  expiresAt: t.integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: t.integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
}));

export const serverKeys = sqliteTable('server_keys', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  encryptedKey: text('encrypted_key').notNull(),
  iv: text('iv').notNull(),
  authTag: text('auth_tag').notNull(),
  use: text('use').notNull().default('sig'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const usedJtis = sqliteTable('used_jtis', {
  jti: text('jti').primaryKey(),
  clientId: text('client_id').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const accessTokens = sqliteTable('access_tokens', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  token: text('token').unique().notNull(),
  userId: text('user_id').notNull(),
  clientId: text('client_id').notNull(),
  dpopJkt: text('dpop_jkt').notNull(),
  scope: text('scope').notNull(),
  loa: integer('loa').default(0).notNull(),
  amr: text('amr'), // Stringified JSON array
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  revoked: integer('revoked', { mode: 'boolean' }).default(false).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const refreshTokens = sqliteTable('refresh_tokens', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  token: text('token').unique().notNull(),
  userId: text('user_id').notNull(),
  clientId: text('client_id').notNull(),
  dpopJkt: text('dpop_jkt').notNull(),
  scope: text('scope').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  revoked: integer('revoked', { mode: 'boolean' }).default(false).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const securityAuditLog = sqliteTable('security_audit_log', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  eventType: text('event_type').notNull(),
  severity: text('severity').notNull(),
  details: text('details', { mode: 'json' }),
  clientId: text('client_id'),
  ipAddress: text('ip_address'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const authSessions = sqliteTable('auth_sessions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  parRequestUri: text('par_request_uri').notNull(),
  clientId: text('client_id').notNull(),
  userId: text('user_id'),
  purpose: text('purpose'),
  status: text('status').notNull(),
  otpCode: text('otp_code'),
  retryCount: integer('retry_count').default(0).notNull(),
  loa: integer('loa').default(0).notNull(),
  amr: text('amr'), // Stringified JSON array
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const authorizationCodes = sqliteTable('authorization_codes', {
  code: text('code').primaryKey(),
  userId: text('user_id').notNull(),
  clientId: text('client_id').notNull(),
  codeChallenge: text('code_challenge').notNull(),
  dpopJkt: text('dpop_jkt').notNull(),
  scope: text('scope').notNull(),
  nonce: text('nonce'),
  state: text('state'),
  loa: integer('loa').default(0).notNull(),
  amr: text('amr'), // Stringified JSON array
  redirectUri: text('redirect_uri').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  used: integer('used', { mode: 'boolean' }).default(false).notNull(),
  usedAt: integer('used_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const qrSessions = sqliteTable('qr_sessions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  parentSessionId: text('parent_session_id'),
  clientId: text('client_id').notNull(),
  state: text('state', { length: 255 }).notNull(),
  nonce: text('nonce', { length: 255 }).notNull(),
  codeVerifier: text('code_verifier', { length: 255 }).notNull(),
  dpopJkt: text('dpop_jkt'), // Thumbprint of the DPoP key
  requestUri: text('request_uri', { length: 1024 }).notNull(),
  status: text('status').notNull().default('PENDING'), // Removed enum option
  authCode: text('auth_code', { length: 2048 }),
  idToken: text('id_token'),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});
