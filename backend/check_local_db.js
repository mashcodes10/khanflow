const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://md.mashiurrahmankhan@localhost:5432/khanflow'
});
async function checkData() {
  await client.connect();
  const res = await client.query('SELECT count(*) FROM users');
  console.log('Local users count:', res.rows[0].count);
  await client.end();
}
checkData().catch(console.error);
