import pg from 'pg';
const { Client } = pg;
const client = new Client({ connectionString: 'postgresql://postgres:Kbg-0042@localhost:15432/mossombi' });
async function run() {
  await client.connect();
  const res = await client.query(\SELECT id, user_id_display, full_name FROM public.users WHERE user_id_display LIKE '\%753380\%'\);
  if (res.rows.length === 0) {
    console.log('Utilisateur 753380 non trouve');
  } else {
    for (const u of res.rows) {
      console.log('Utilisateur trouvé:', u);
      const ag = await client.query('SELECT * FROM public.agency_memberships WHERE user_id = ', [u.id]);
      if (ag.rows.length > 0) {
        console.log('OUI, il a une ou plusieurs agences:');
        console.table(ag.rows);
      } else {
        console.log('NON, il n a pas d agence associee.');
      }
    }
  }
  await client.end();
}
run().catch(console.error);
