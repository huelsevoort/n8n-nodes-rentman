// Loads parameters into the node the way n8n does when it opens a saved workflow, and runs n8n's
// parameter validator (the check behind "The workflow has issues"). Shared by issues.js and upgrade-check.js.
const path = require('path');

const loadDescription = (repoOrPackage) => new (require(path.join(repoOrPackage, 'dist/nodes/Rentman/Rentman.node.js')).Rentman)().description;

function validate(NodeHelpers, description, params) {
	const node = { id: 'x', name: 'x', type: 'n8n-nodes-rentman.rentman', typeVersion: 1, position: [0, 0], parameters: {} };
	node.parameters = NodeHelpers.getNodeParameters(description.properties, params, true, false, node, description) || {};
	return { parameters: node.parameters, issues: NodeHelpers.getNodeParametersIssues(description.properties, node, description) };
}

module.exports = { loadDescription, validate };
