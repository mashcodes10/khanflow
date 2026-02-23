const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.fncrvjemsycdzrdkjcvy:balerKhanflow@aws-0-us-west-2.pooler.supabase.com:6543/postgres'
});
async function checkData() {
  await client.connect();
  const res = await client.query('SELECT count(*) FROM users');
  console.log('Users count:', res.rows[0].count);
  await client.end();
}
checkData().catch(console.error);
