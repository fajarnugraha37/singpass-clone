import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { migrate } from 'drizzle-orm/libsql/migrator';
import * as schema from './schema';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let dbClient: any;
let initPromise: Promise<any> | null = null;

export const getDb = async () => {
  if (dbClient) return dbClient;
  
  if (!initPromise) {
    initPromise = (async () => {
      const isTest = process.argv.some(arg => arg.includes('test')) || process.env.NODE_ENV === 'test' || process.env.BUN_ENV === 'test' || process.env.DATABASE_URL?.includes(':memory:');
      let url = process.env.DATABASE_URL || 'file:backend.db';
      if (url.includes('./apps/backend/backend.db')) {
          url = url.replace('./apps/backend/backend.db', 'backend.db');
      }
      
      const testDbName = 'file::memory:?cache=shared';
      
      const effectiveUrl = isTest ? testDbName : url;
      
      console.log(`[DB] Connecting to ${effectiveUrl}...`);
      const client = createClient({ url: effectiveUrl });
      const newClient = drizzle(client, { schema });

      // Auto-migrate in-memory database
      if (effectiveUrl.includes('memory')) {
        console.log('[DB] Migrating in-memory database...');
        // Path relative to this file: apps/backend/src/infra/database/client.ts
        // Migrations are in: apps/backend/drizzle
        const migrationsFolder = resolve(__dirname, '../../../drizzle');
        await migrate(newClient, { migrationsFolder });
        console.log('[DB] Migration complete.');
      }
      
      dbClient = newClient;
      return dbClient;
    })();
  }
  
  return initPromise;
};

// For compatibility, but note that it might not be ready yet if used as a top-level export
export const db = new Proxy({} as any, {
  get: (target, prop) => {
    if (prop in target) {
      return target[prop];
    }
    if (!dbClient) {
      throw new Error('Database not initialized. Call await getDb() first.');
    }
    const value = dbClient[prop];
    return typeof value === 'function' ? value.bind(dbClient) : value;
  },
  set: (target, prop, value) => {
    target[prop] = value;
    return true;
  }
});

