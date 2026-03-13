import { sql } from 'drizzle-orm';
import { text, integer, sqliteTable } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  nric: text('nric').unique(),
  name: text('name').notNull(),
  email: text('email').unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').references(() => users.id),
  dpopJkt: text('dpop_jkt'),
  loa: integer('loa').default(0).notNull(),
  isAuthenticated: integer('is_authenticated', { mode: 'boolean' }).default(false).notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
});

export const parRequests = sqliteTable('par_requests', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  requestUri: text('request_uri').unique().notNull(),
  clientId: text('client_id').notNull(),
  dpopJkt: text('dpop_jkt'),
  payload: text('payload', { mode: 'json' }).notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const authCodes = sqliteTable('auth_codes', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  code: text('code').unique().notNull(),
  sessionId: text('session_id').notNull().references(() => sessions.id),
  parId: integer('par_id').notNull().references(() => parRequests.id),
  codeChallenge: text('code_challenge').notNull(),
  codeChallengeMethod: text('code_challenge_method').default('S256').notNull(),
  dpopJkt: text('dpop_jkt').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
});

export const serverKeys = sqliteTable('server_keys', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  encryptedKey: text('encrypted_key').notNull(),
  iv: text('iv').notNull(),
  authTag: text('auth_tag').notNull(),
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
  status: text('status').notNull(),
  otpCode: text('otp_code'),
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
  nonce: text('nonce'),
  redirectUri: text('redirect_uri').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  used: integer('used', { mode: 'boolean' }).default(false).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});
