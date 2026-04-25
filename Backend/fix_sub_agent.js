import pg from 'pg';
const client = new pg.Client({ connectionString: 'postgresql://postgres:Kbg-0042@localhost:15432/mossombi' });
async function run() {
  await client.connect();
  const res = await client.query("UPDATE public.agency_memberships SET role_in_agency = 'agent' WHERE role_in_agency = 'sub_agent'");
  console.log(res.rowCount + ' sub_agents updated to agent.');
  await client.end();
}
run().catch(console.error);
