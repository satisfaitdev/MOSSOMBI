import pg from 'pg';
const client = new pg.Client({ connectionString: 'postgresql://postgres:Kbg-0042@localhost:15432/mossombi' });
async function run() {
  await client.connect();
  const res = await client.query(\UPDATE public.agency_memberships SET status = 'approved' WHERE status = 'pending' RETURNING id\);
  console.log(res.rows.length + ' memberships set to approved.');
  await client.end();
}
run().catch(console.error);
