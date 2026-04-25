const fs = require('fs');
let code = fs.readFileSync('../Backend/src/routes/agencies.js', 'utf8');

// Find the GET /my/staff block and replace .eq('status', 'approved')
const searchStr = `.from('agency_memberships')
    .select('*')
    .eq('agency_id', ctx.agency.id)
    .eq('status', 'approved')`;

const replaceStr = `.from('agency_memberships')
    .select('*')
    .eq('agency_id', ctx.agency.id)
    .in('status', ['approved', 'pending'])`;

if (code.includes(searchStr)) {
  code = code.replace(searchStr, replaceStr);
  fs.writeFileSync('../Backend/src/routes/agencies.js', code);
  console.log('Backend /my/staff patched successfully.');
} else {
  console.log('Search string not found, perhaps already patched?');
}
