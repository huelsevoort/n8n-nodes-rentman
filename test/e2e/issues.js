// Runs n8n's own parameter validator (the check behind "The workflow has issues") on every case.
const path = require('path');
const { NodeHelpers } = require(path.join(process.env.N8N_MODS, 'n8n-workflow'));
const { loadDescription, validate } = require('./validate');
const desc = loadDescription(path.join(process.env.N8N_USER_FOLDER, '.n8n/nodes/node_modules/n8n-nodes-rentman'));
const cases = require(path.join(process.argv[2], 'expectations.json'));
let bad = 0;
for (const c of cases) {
	const { issues } = validate(NodeHelpers, desc, c.params);
	if (issues) { bad++; console.log(c.name, JSON.stringify(issues)); }
}
console.log(`${cases.length - bad}/${cases.length} parameter sets without validator issues`);
process.exit(bad ? 1 : 0);
