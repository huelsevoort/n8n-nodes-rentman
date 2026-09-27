// Runs n8n's own parameter validator (the check behind "The workflow has issues") on every case.
const path = require('path');
const { NodeHelpers } = require(path.join(process.env.N8N_MODS, 'n8n-workflow'));
const { Rentman } = require(path.join(process.env.N8N_USER_FOLDER, '.n8n/nodes/node_modules/n8n-nodes-rentman/dist/nodes/Rentman/Rentman.node.js'));
const desc = new Rentman().description;
const cases = require(path.join(process.argv[2], 'expectations.json'));
let bad = 0;
for (const c of cases) {
	const node = { id: 'x', name: 'x', type: 'n8n-nodes-rentman.rentman', typeVersion: 1, position: [0, 0], parameters: {} };
	node.parameters = NodeHelpers.getNodeParameters(desc.properties, c.params, true, false, node, desc) || {};
	const issues = NodeHelpers.getNodeParametersIssues(desc.properties, node, desc);
	if (issues) { bad++; console.log(c.name, JSON.stringify(issues)); }
}
console.log(`${cases.length - bad}/${cases.length} parameter sets without validator issues`);
