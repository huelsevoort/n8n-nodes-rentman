// Live check of every read operation of the node against the real Rentman API, inside n8n.
// Usage: node live-reads.js <repo> <outDir>   (env from env.sh; RENTMAN_API_TOKEN for direct lookups)
// For each resource it picks a real record X via the API directly, then runs in n8n:
//   get       -> must return X
//   getAll    -> min (limit 1), offset (limit 1, offset 1), and "full": every filter, Fields, Sort,
//                Expand and Custom Query Parameters (plus a blank row) set to values taken from X,
//                which must return X and nothing that contradicts the filters.
//   sub-collection getters (getFiles, getForEquipment, getForParent ...) -> must succeed, once plain and once with
//                every filter, Fields, Sort, Expand and Custom Query Parameters set to values that match everything.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { runBatch } = require('./live-lib');

const repo = process.argv[2];
const outDir = process.argv[3];
const { Rentman } = require(path.join(repo, 'dist/nodes/Rentman/Rentman.node.js'));
const d = new Rentman().description;

function api(p) {
	const args = ['-sS', `https://api.rentman.net${p}`];
	if (process.env.RENTMAN_API_TOKEN) args.push('-H', `Authorization: Bearer ${process.env.RENTMAN_API_TOKEN}`);
	return JSON.parse(execFileSync('curl', args, { maxBuffer: 1 << 28 }).toString());
}
const firstCache = {};
function first(coll) {
	if (!(coll in firstCache)) firstCache[coll] = api(`${coll}?limit=1&sort=%2Bid`).data?.[0] ?? null;
	return firstCache[coll];
}

const visible = (p, v) => {
	const s = p.displayOptions?.show;
	if (!s) return true;
	return Object.entries(s).every(([k, a]) => (k in v ? a.includes(v[k]) : true));
};
const shift = (iso, days) => new Date(new Date(iso).getTime() + days * 864e5).toISOString().slice(0, 19);

// Every filter/Fields/Sort/Expand/Custom Query Parameter of an operation, set to values that do not narrow the list.
function neutralFilters(props) {
	const params = { returnAll: false, limit: 5 };
	for (const p of props) {
		if (p.name === 'filters' || p.name === 'additionalFields' || p.name === 'options') {
			const v = {};
			for (const o of p.options) {
				const qsKey = Object.keys(o.routing?.request?.qs || {})[0];
				if (!qsKey) continue;
				if (qsKey === 'fields') v[o.name] = 'id,displayname';
				else if (qsKey === 'sort') v[o.name] = '-id';
				else if (qsKey === 'id[gt]') v[o.name] = 0;
				else if (qsKey.endsWith('[gt]')) v[o.name] = '2000-01-01T00:00:00';
				else if (qsKey.endsWith('[lt]')) v[o.name] = '2100-01-01T00:00:00';
				else if (o.type === 'options') v[o.name] = o.options[0].value;
				else if (o.type === 'boolean') v[o.name] = true;
				else if (o.type === 'number') v[o.name] = 1;
				else v[o.name] = o.placeholder?.startsWith('/') ? o.placeholder : 'x';
			}
			params[p.name] = v;
		} else if (p.name === 'expand') params.expand = 'creator';
		else if (p.name === 'customQueryParams') params.customQueryParams = { params: [{ key: 'id[gt]', value: '0' }, { key: '', value: 'blank-row' }] };
	}
	return params;
}

const resources = d.properties.find((p) => p.name === 'resource').options;
const cases = [];
const skipped = [];
for (const r of resources) {
	for (const opProp of d.properties.filter((p) => p.name === 'operation' && visible(p, { resource: r.value }))) {
		for (const op of opProp.options) {
			if ((op.routing?.request?.method || 'GET') !== 'GET') continue;
			const base = { resource: r.value, operation: op.value };
			const props = d.properties.filter((p) => !['resource', 'operation'].includes(p.name) && p.displayOptions && visible(p, { ...base, returnAll: false }));
			const idProp = props.find((p) => p.required && p.routing?.request?.url);
			const collUrl = op.routing?.request?.url || idProp?.routing.request.url;

			if (op.value === 'getForParent') {
				const parents = props.find((p) => p.name === 'parentResource').options.map((o) => o.value);
				for (const parent of parents) {
					const x = first(`/${parent}`);
					if (!x) { skipped.push(`${r.value}.${op.value}[${parent}]: no ${parent} in account`); continue; }
					cases.push({ name: `${r.value}.${op.value}[${parent}]`, params: { ...base, parentResource: parent, parentId: String(x.id) }, check: 'ok' });
					if (parent === parents.find((p) => first(`/${p}`)))
						cases.push({ name: `${r.value}.${op.value}[${parent}].filtered`, params: { ...base, ...neutralFilters(props), parentResource: parent, parentId: String(x.id) }, check: 'ok' });
				}
				continue;
			}
			if (op.value === 'getAll') {
				const coll = collUrl;
				const x = first(coll);
				cases.push({ name: `${r.value}.getAll.min`, params: { ...base, returnAll: false, limit: 1 }, check: 'ok' });
				if (!x) { skipped.push(`${r.value}.getAll: collection empty, only min/offset run`); }
				cases.push({ name: `${r.value}.getAll.offset`, params: { ...base, returnAll: false, limit: 1, offset: 1 }, check: 'ok', notId: x?.id });
				if (!x) continue;
				const full = api(`${coll}/${x.id}`).data;
				const params = { ...base, returnAll: false, limit: 5 };
				const applied = {};
				for (const p of props) {
					if (p.name === 'filters' || p.name === 'additionalFields' || p.name === 'options') {
						const v = {};
						for (const o of p.options) {
							const qsKey = Object.keys(o.routing?.request?.qs || {})[0];
							if (!qsKey) continue;
							const field = qsKey.replace(/\[.*\]$/, '');
							let val;
							if (qsKey === 'fields') val = 'id,displayname';
							else if (qsKey === 'sort') val = '-id';
							else if (qsKey === 'expand') val = 'creator';
							else if (qsKey === 'id[gt]') val = x.id - 1;
							else if (qsKey.endsWith('[gt]')) val = full[field] ? shift(full[field], -1) : undefined;
							else if (qsKey.endsWith('[lt]')) val = full[field] ? shift(full[field], 1) : undefined;
							else if (!(field in full)) val = o.type === 'options' ? o.options[0].value : o.type === 'boolean' ? true : 'x'; // not a field of the record: send anyway so the API judges it
							else val = full[field];
							if (val === undefined || val === null || val === '') continue;
							if (o.type === 'string' && typeof val !== 'string') val = String(val);
							v[o.name] = val;
							applied[qsKey] = val;
						}
						params[p.name] = v;
					} else if (p.name === 'expand') {
						params.expand = 'creator';
					} else if (p.name === 'customQueryParams') {
						params.customQueryParams = { params: [{ key: 'id', value: String(x.id) }, { key: '', value: 'blank-row' }] };
					}
				}
				cases.push({ name: `${r.value}.getAll.full`, params, check: 'hasX', x: x.id, applied });
				continue;
			}
			// get / sub-collection getters: need a real id of the resource the URL points at
			const coll = collUrl.replace(/^=/, '').split('/{{')[0];
			const x = first(coll);
			if (!x) { skipped.push(`${r.value}.${op.value}: no record in ${coll} (checked in write phase if creatable)`); continue; }
			const params = { ...base, [idProp.name]: String(x.id) };
			for (const p of props) if (p.name === 'expand') params.expand = 'creator';
			cases.push({ name: `${r.value}.${op.value}`, params, check: op.value === 'get' ? 'isX' : 'ok', x: x.id });
			if (op.value !== 'get' && props.some((p) => p.name === 'filters'))
				cases.push({ name: `${r.value}.${op.value}.filtered`, params: { ...base, ...neutralFilters(props), [idProp.name]: String(x.id) }, check: 'ok' });
		}
	}
}

const res = runBatch(cases, path.join(outDir, 'wf'));
const report = [];
for (const c of cases) {
	const o = res[c.name];
	let problem = o.error;
	if (!problem && c.check === 'isX' && o.first?.id !== c.x) problem = `expected record ${c.x}, got ${o.first?.id}`;
	if (!problem && c.check === 'hasX' && !o.all.some((i) => i.id === c.x)) problem = `filtered by record ${c.x}'s own values but it was not returned (${o.items} items)`;
	if (!problem && c.check === 'hasX' && o.first && Object.keys(o.first).some((k) => !['id', 'displayname', 'link', 'updateHash', 'custom', 'created', 'modified', 'creator'].includes(k))) problem = `Fields=id,displayname ignored: got ${Object.keys(o.first).join(',')}`;
	if (!problem && c.notId !== undefined && o.first && o.first.id === c.notId) problem = 'offset ignored';
	report.push({ name: c.name, ok: !problem, problem, items: o.items, params: c.params, applied: c.applied });
}
fs.writeFileSync(path.join(outDir, 'reads.json'), JSON.stringify({ report, skipped }, null, 1));
const bad = report.filter((x) => !x.ok);
console.log(`reads: ${report.length} runs, ${report.length - bad.length} ok, ${bad.length} failed, ${skipped.length} skipped`);
for (const b of bad) console.log(`FAIL ${b.name}: ${b.problem}`);
for (const s of skipped) console.log(`SKIP ${s}`);
