import pg from 'pg';
const { Client } = pg;
const client = new Client({ connectionString: 'postgresql://postgres:Kbg-0042@localhost:15432/mossombi' });
async function run() {
  await client.connect();
  const userId = '32f2768f-cf71-4d3d-9250-c413016bc5d3';
  const res = await client.query('DELETE FROM public.agency_memberships WHERE user_id = $1 RETURNING *', [userId]);
  
  if (res.rows.length > 0) {
    console.log(`${res.rows.length} ancienne(s) demande(s) supprimée(s) avec succès !`);
  } else {
    console.log('Aucune demande trouvée à supprimer.');
  }
  
  await client.end();
}
run().catch(console.error);
