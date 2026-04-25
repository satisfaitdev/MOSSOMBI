import pg from 'pg';
const client = new pg.Pool({ connectionString: 'postgresql://postgres:Kbg-0042@localhost:15432/mossombi' });
client.query("SELECT m.* FROM agency_memberships m JOIN users u ON m.user_id = u.id WHERE u.user_id_display = 'MSB-753380'").then(res => { console.log(res.rows); process.exit(0); });
