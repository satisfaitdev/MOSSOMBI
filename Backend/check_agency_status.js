import pg from 'pg';
const client = new pg.Client({ connectionString: 'postgresql://postgres:Kbg-0042@localhost:15432/mossombi' });
async function run() {
  await client.connect();
  const res = await client.query("SELECT id, name, status FROM public.agencies");
  console.table(res.rows);
  const mem = await client.query("SELECT * FROM public.agency_memberships");
  console.table(mem.rows);
  
  // also check if Justin 227735 exists
  const u = await client.query("SELECT id, user_id_display FROM public.users");
  console.table(u.rows);
  
  await client.end();
}
run().catch(console.error);
