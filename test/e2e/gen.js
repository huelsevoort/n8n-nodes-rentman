// Generates n8n workflows that exercise every resource/operation of the Rentman node
// twice: "min" (required params only) and "full" (every optional field filled).
// Also writes expectations.json describing what each node must send.
const fs = require('fs');
const path = require('path');
const repo = process.argv[2];
const outDir = process.argv[3];
const { Rentman } = require(path.join(repo, 'dist/nodes/Rentman/Rentman.node.js'));
const d = new Rentman().description;
// Collection fields the node itself requires before sending (see REQUIRED_BODY_FIELDS in shared.ts);
// the "min" variant fills them too. Older builds have none.
let requiredBody = {};
try { requiredBody = require(path.join(repo, 'dist/nodes/Rentman/descriptions/shared.js')).REQUIRED_BODY_FIELDS || {}; } catch {}

const visible = (p, vals) => {
	const show = p.displayOptions?.show;
	if (!show) return true;
	return Object.entries(show).every(([k, allowed]) => allowed.includes(vals[k]));
};

function dummy(p) {
	switch (p.type) {
		case 'string':
			if (/ID$/.test(p.displayName) || /Id$/.test(p.name)) return '101';
			if (/\(Path\)/.test(p.displayName) || (p.placeholder || '').startsWith('/'))
				return (p.placeholder && p.placeholder.startsWith('/')) ? p.placeholder : '/contacts/1';
			if (p.name === 'expand') return 'creator';
			if (p.name === 'fields') return 'id,displayname,custom_3';
			if (p.name === 'sort') return '+id';
			return `t_${p.name}`;
		case 'number': return 7;
		case 'boolean': return !p.default;
		case 'options': return p.options[p.options.length - 1].value;
		case 'dateTime': return '2026-01-02T03:04:05';
		case 'color': return '#00AA00';
		case 'json': return '{"custom_1":"t"}';
		default: return undefined;
	}
}

// Extract where a field ends up in the request: {in:'qs'|'body'|'url', key}
function sinks(p) {
	const out = [];
	const r = p.routing || {};
	const req = r.request || {};
	for (const where of ['qs', 'body']) {
		if (req[where]) for (const k of Object.keys(req[where])) out.push({ in: where, key: k, expr: req[where][k] });
	}
	if (req.url) out.push({ in: 'url', expr: req.url });
	if (r.send && r.send.property) out.push({ in: r.send.type === 'query' ? 'qs' : 'body', key: r.send.property, dynamic: true });
	return out;
}

function fillCollection(p, expect, prefix) {
	const v = {};
	for (const o of p.options || []) {
		const val = dummy(o);
		if (val === undefined) continue;
		v[o.name] = val;
		for (const s of sinks(o)) expect.push({ ...s, field: `${prefix}${p.name}.${o.name}`, value: val });
	}
	return v;
}

function fillFixed(p, expect, prefix) {
	const v = {};
	for (const grp of p.options || []) {
		const row = {};
		for (const f of grp.values) {
			let val = dummy(f);
			if (p.name === 'customQueryParams') val = f.name === 'key' ? 'custom_3' : 'cq_value';
			if (val === undefined) continue;
			row[f.name] = val;
		}
		if (p.name === 'customQueryParams') {
			expect.push({ in: 'qs', key: 'custom_3', field: `${prefix}${p.name}`, value: 'cq_value' });
			v[grp.name] = [row, { key: '', value: 'blank-row' }];
		} else {
			for (const f of grp.values) for (const s of sinks(f)) expect.push({ ...s, field: `${prefix}${p.name}.${grp.name}.${f.name}`, value: row[f.name], nested: true });
			v[grp.name] = typeOptionsMulti(p) ? [row] : row;
		}
	}
	return v;
}
const typeOptionsMulti = (p) => !!p.typeOptions?.multipleValues;

const resources = d.properties.find((p) => p.name === 'resource').options;
const cases = [];
for (const r of resources) {
	const opProps = d.properties.filter((p) => p.name === 'operation' && visible(p, { resource: r.value }));
	for (const opProp of opProps) {
		for (const op of opProp.options) {
			for (const variant of ['min', 'full']) {
				const vals = { resource: r.value, operation: op.value };
				const expect = [];
				if (variant === 'full' || true) vals.returnAll = false;
				for (const p of d.properties) {
					if (['resource', 'operation'].includes(p.name)) continue;
					if (!visible(p, vals)) continue;
					if (p.name === 'returnAll') { vals.returnAll = false; continue; }
					if (p.required) {
						const val = p.type === 'collection' ? fillCollection(p, expect, '') : dummy(p);
						vals[p.name] = val;
						for (const s of sinks(p)) expect.push({ ...s, field: p.name, value: val });
					} else if (variant === 'min' && p.type === 'collection' && requiredBody[`${r.value}.${op.value}`]) {
						const keys = requiredBody[`${r.value}.${op.value}`].map(([k]) => k);
						const only = { ...p, options: p.options.filter((o) => sinks(o).some((s) => keys.includes(s.key))) };
						if (only.options.length) vals[p.name] = fillCollection(only, expect, '');
					} else if (variant === 'full') {
						let val;
						if (p.type === 'collection') val = fillCollection(p, expect, '');
						else if (p.type === 'fixedCollection') val = fillFixed(p, expect, '');
						else if (p.name === 'limit') val = 2;
						else if (p.name === 'offset') val = 1;
						else val = dummy(p);
						if (val === undefined) continue;
						vals[p.name] = val;
						if (!['collection', 'fixedCollection'].includes(p.type))
							for (const s of sinks(p)) expect.push({ ...s, field: p.name, value: val });
					}
				}
				const method = (op.routing?.request?.method) || 'GET';
				cases.push({ name: `${r.value}.${op.value}.${variant}`, resource: r.value, operation: op.value, variant, method, opUrl: op.routing?.request?.url, params: vals, expect });
			}
		}
	}
}

// Split into workflows of up to 60 nodes chained after a manual trigger.
fs.mkdirSync(outDir, { recursive: true });
const chunk = 60;
const files = [];
for (let i = 0; i < cases.length; i += chunk) {
	const part = cases.slice(i, i + chunk);
	const nodes = [{ id: 'trigger', name: 'Start', type: 'n8n-nodes-base.manualTrigger', typeVersion: 1, position: [0, 0], parameters: {} }];
	const connections = {};
	let prev = 'Start';
	part.forEach((c, j) => {
		nodes.push({
			id: `n${i + j}`, name: c.name, type: 'n8n-nodes-rentman.rentman', typeVersion: 1, position: [200 * (j + 1), 0],
			parameters: c.params, credentials: { rentmanApi: { id: 'rentmanMock', name: 'Rentman Mock' } },
			executeOnce: true, alwaysOutputData: true, onError: 'continueRegularOutput',
		});
		connections[prev] = { main: [[{ node: c.name, type: 'main', index: 0 }]] };
		prev = c.name;
	});
	const wf = { id: `rentmanTest${i / chunk}`, name: `Rentman test ${i / chunk}`, active: false, nodes, connections, settings: {}, pinData: {} };
	const f = path.join(outDir, `wf${i / chunk}.json`);
	fs.writeFileSync(f, JSON.stringify(wf, null, 1));
	files.push(f);
}
fs.writeFileSync(path.join(outDir, 'expectations.json'), JSON.stringify(cases, null, 1));
console.log(`${cases.length} cases, ${files.length} workflows`);
