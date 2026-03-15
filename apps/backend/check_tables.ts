import { createClient } from '@libsql/client';

main()
async function main() {
    const client = createClient({ url: 'file:backend.db' });
    const res = await client.execute("SELECT name FROM sqlite_master WHERE type='table'");
    console.log(res.rows.map(r => r.name));
    process.exit(0);
}