// Checks that workflows saved with an older release still pass n8n's parameter validator on this
// build (the check behind "The workflow has issues"). Generates every operation of the old build
// with only required and with all optional fields, then validates those parameters against the new node.
// Usage: node upgrade-check.js <old repo, built> <new repo, built> <n8n node_modules> <scratch dir>
const path = require('path');
const { execFileSync } = require('child_process');
const [oldRepo, newRepo, mods, dir] = process.argv.slice(2);
execFileSync('node', [path.join(__dirname, 'gen.js'), oldRepo, dir]);
const { NodeHelpers } = require(path.join(mods, 'n8n-workflow'));
const desc = new (require(path.join(newRepo, 'dist/nodes/Rentman/Rentman.node.js')).Rentman)().description;
const cases = require(path.join(dir, 'expectations.json'));
let bad = 0;
for (const c of cases) {
	const node = { id: 'x', name: 'x', type: 'n8n-nodes-rentman.rentman', typeVersion: 1, position: [0, 0], parameters: {} };
	node.parameters = NodeHelpers.getNodeParameters(desc.properties, c.params, true, false, node, desc) || {};
	const issues = NodeHelpers.getNodeParametersIssues(desc.properties, node, desc);
	if (issues) { bad++; console.log(c.name, JSON.stringify(issues.parameters)); }
}
console.log(`${cases.length - bad}/${cases.length} old parameter sets pass the validator on the new build`);
process.exit(bad ? 1 : 0);
