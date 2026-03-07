import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure the database path is consistent regardless of where the process is started from
const defaultDbUrl = `file:${join(__dirname, '../../../backend.db')}`;

const client = createClient({
  url: process.env.DATABASE_URL || defaultDbUrl,
});

export const db = drizzle(client, { schema });
