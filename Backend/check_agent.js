import pg from 'pg';
const { Client } = pg;
const client = new Client({
  connectionString: 'postgresql://postgres:Kbg-0042@localhost:15432/mossombi'
});

async function run() {
  await client.connect();
  const userRes = await client.query("SELECT id, user_id_display FROM users WHERE user_id_display LIKE '%227735%'");
  if (userRes.rowCount === 0) { console.log('User not found'); await client.end(); return; }
  const userId = userRes.rows[0].id;
  console.log('User:', userRes.rows[0]);
  const ownedRes = await client.query("SELECT id, name, status FROM agencies WHERE owner_user_id = $1", [userId]);
  console.log('Owned agencies:', ownedRes.rows);
  const memberRes = await client.query("SELECT id, agency_id, role_in_agency, status FROM agency_memberships WHERE user_id = $1", [userId]);
  console.log('Memberships:', memberRes.rows);
  await client.end();
}
run().catch(console.error);
