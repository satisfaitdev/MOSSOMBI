const pg = require('../Backend/node_modules/pg');
const client = new pg.Pool({ connectionString: 'postgresql://postgres:Kbg-0042@localhost:15432/mossombi' });
client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'agency_memberships'").then(res => { console.log(JSON.stringify(res.rows, null, 2)); client.end(); });
