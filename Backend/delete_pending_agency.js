import pg from 'pg';
const client = new pg.Client({ connectionString: 'postgresql://postgres:Kbg-0042@localhost:15432/mossombi' });
async function run() {
  await client.connect();
  const userId = '32f2768f-cf71-4d3d-9250-c413016bc5d3'; // Juste 753380
  
  const res = await client.query("DELETE FROM public.agencies WHERE owner_user_id = $1 RETURNING *", [userId]);
  console.log('Agences supprimées pour 753380 :', res.rows.length);
  
  await client.end();
}
run().catch(console.error);
