const pg = require('../Backend/node_modules/pg');
const client = new pg.Pool({ connectionString: 'postgresql://postgres:Kbg-0042@localhost:15432/mossombi' });
client.query("ALTER TABLE agency_memberships ADD COLUMN IF NOT EXISTS service_permissions JSONB DEFAULT '{}'::jsonb;").then(res => { console.log('Column added'); client.end(); });
