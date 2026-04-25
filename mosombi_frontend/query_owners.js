import pg from 'pg';
const client = new pg.Client({ connectionString: 'postgresql://postgres:Kbg-0042@localhost:15432/mossombi' });
async function run() {
  await client.connect();
  const res = await client.query(\SELECT id, name, status, owner_user_id FROM public.agencies\);
  console.table(res.rows);
  await client.end();
}
run().catch(console.error);
