import { createClient } from '@libsql/client';

main()
async function main() {
    const client = createClient({ url: 'file:backend.db' });
    const res = await client.execute("SELECT * FROM __drizzle_migrations");
    console.log(res.rows);
    process.exit(0);
}
