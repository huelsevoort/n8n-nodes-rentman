// Checks that workflows saved with an older release keep working on this build. Generates every
// operation of the old build (only required and all optional fields) and loads those parameters the
// way n8n does when it opens a saved workflow. A case fails when
// - n8n's parameter validator reports issues (the check behind "The workflow has issues"),
// - a parameter the old workflow had is dropped on load (moved or renamed field: its value is lost),
// - an options value the old workflow had is no longer offered, or
// - a value the old workflow did not set gets sent now (a new required field with a default).
// Removals the CHANGELOG lists as breaking are allowed in ALLOWED below.
// Usage: node upgrade-check.js <old repo, built> <new repo, built> <n8n node_modules> <scratch dir>
const path = require('path');
const { execFileSync } = require('child_process');
const [oldRepo, newRepo, mods, dir] = process.argv.slice(2);
execFileSync('node', [path.join(__dirname, 'gen.js'), oldRepo, dir], { stdio: 'inherit' });
const { NodeHelpers } = require(path.join(mods, 'n8n-workflow'));
const { loadDescription, validate } = require('./validate');
const oldDesc = loadDescription(oldRepo);
const desc = loadDescription(newRepo);
const cases = require(path.join(dir, 'expectations.json'));

// <resource>.<operation> <parameter path>[=<value>]; each entry is listed under "Removed (breaking)"
// or "Upgrading from 26.5.0" in the CHANGELOG.
const ALLOWED = new Set([
	'appointmentCrew.update updateFields.remark',
	'contactPerson.update updateFields.remark',
	'crew.getAll filters.external',
	'project.create additionalFields.color',
	'project.create additionalFields.conditions',
	'project.create additionalFields.customer',
	'project.create additionalFields.project_type',
	'project.create additionalFields.remark',
	'project.create additionalFields.status',
	...['create', 'createForParent', 'update'].map((op) => `task.${op} additionalFields.public`),
	'timeRegistration.update updateFields.status',
	...['getFiles', 'getFileFolders', 'getInvoiceLines', 'getOrderCosts', 'getGlobalCosts'].flatMap((op) => [
		`purchaseOrder.${op} filters.approval_status`,
		`purchaseOrder.${op} filters.supplier`,
	]),
	...['getFiles', 'getFileFolders'].flatMap((op) => [`supplier.${op} filters.contact`, `supplier.${op} filters.equipment`]),
	// removed option values
	'contact.getAll filters.type=other',
	'timeRegistration.getAll filters.status=open',
	'crewAvailability.create additionalFields.status=Y',
	'crewAvailability.update updateFields.status=Y',
	...['getAll filters', 'create additionalFields', 'update additionalFields'].flatMap((p) => [
		`equipment.${p}.type=normal`,
		`equipment.${p}.type=consumable`,
	]),
	// new required fields with a harmless default (documented under "Upgrading from 26.5.0")
	'leaveRequest.create +approval_status',
]);

const vis = (p, vals) => !p.displayOptions?.show || Object.entries(p.displayOptions.show).every(([k, a]) => a.includes(vals[k.replace(/^\//, '')]));
// Options values offered per parameter path (collections and fixed collections included).
function optionValues(d, vals) {
	const out = {};
	const walk = (p, pre) => {
		const id = pre + p.name;
		if (p.type === 'options' || p.type === 'multiOptions') out[id] = p.options.map((o) => o.value);
		if (p.type === 'collection') for (const c of p.options) if (vis(c, vals)) walk(c, id + '.');
		if (p.type === 'fixedCollection') for (const g of p.options) for (const c of g.values) walk(c, `${id}.${g.name}.`);
	};
	for (const p of d.properties) if (vis(p, vals)) walk(p, '');
	return out;
}
const isEmpty = (v) => v === '' || v === undefined || v === null || (typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).length);
function leaves(obj, pre = '', out = {}) {
	for (const [k, v] of Object.entries(obj || {})) {
		const id = pre + k;
		if (v && typeof v === 'object' && !Array.isArray(v)) leaves(v, id + '.', out);
		else out[id] = v;
	}
	return out;
}

let bad = 0;
for (const c of cases) {
	const op = `${c.params.resource}.${c.params.operation}`;
	const problems = [];
	const { parameters, issues } = validate(NodeHelpers, desc, c.params);
	if (issues) problems.push(`validator: ${JSON.stringify(issues.parameters)}`);

	// What n8n keeps of the old values, and what it adds with defaults.
	const before = leaves(validate(NodeHelpers, oldDesc, c.params).parameters);
	const after = leaves(parameters);
	const offered = optionValues(desc, parameters);
	for (const [k, v] of Object.entries(before)) {
		if (['resource', 'operation'].includes(k) || isEmpty(v)) continue;
		if (!(k in after)) {
			if (!ALLOWED.has(`${op} ${k}`)) problems.push(`dropped ${k}`);
		} else if (offered[k] && ![].concat(v).every((x) => offered[k].includes(x))) {
			if (!ALLOWED.has(`${op} ${k}=${v}`)) problems.push(`option value no longer offered: ${k}=${v}`);
		} else if (JSON.stringify(after[k]) !== JSON.stringify(v)) problems.push(`changed ${k}: ${JSON.stringify(v)} -> ${JSON.stringify(after[k])}`);
	}
	for (const [k, v] of Object.entries(after)) {
		if (k in before || isEmpty(v) || ALLOWED.has(`${op} +${k}`)) continue;
		const prop = desc.properties.find((p) => p.name === k && vis(p, parameters));
		if (prop?.routing) problems.push(`new value sent by default: ${k}=${JSON.stringify(v)}`);
	}
	if (problems.length) {
		bad++;
		console.log(c.name, problems.join('; '));
	}
}
console.log(`${cases.length - bad}/${cases.length} old parameter sets keep every value and pass the validator on the new build`);
process.exit(bad ? 1 : 0);
