const { Client } = require('pg');
const client = new Client({
    connectionString: 'postgresql://postgres.fncrvjemsycdzrdkjcvy:balerKhanflow@aws-0-us-west-2.pooler.supabase.com:6543/postgres'
});
async function checkData() {
    await client.connect();
    const res = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
  `);
    console.log('Tables:', res.rows.map(r => r.table_name));

    if (res.rows.length > 0) {
        for (const row of res.rows) {
            if (!['pg_stat_statements', 'auth'].includes(row.table_name)) {
                try {
                    const count = await client.query(`SELECT count(*) FROM "${row.table_name}"`);
                    console.log(`Table ${row.table_name} has ${count.rows[0].count} rows`);
                } catch (e) {
                    console.log(`Error counting ${row.table_name}`);
                }
            }
        }
    }
    await client.end();
}
checkData().catch(console.error);
