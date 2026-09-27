// Live check of "Return All": forces small pages with a Custom Query Parameter `limit`, combined with
// filters, Fields, Sort and Expand, and compares the result with the same list read directly.
// Usage: node live-pagination.js <outDir>
const path = require('path');
const { execFileSync } = require('child_process');
const { runBatch, authHeader } = require('./live-lib');

function apiAll(p) {
	const out = [];
	let url = `https://api.rentman.net${p}`;
	while (url) {
		const args = ['-sS', url];
		if (process.env.RENTMAN_API_TOKEN) args.push('-H', '@-'); // header via stdin, not visible in the process list
		const r = JSON.parse(execFileSync('curl', args, { maxBuffer: 1 << 28, input: authHeader() }).toString());
		out.push(...r.data);
		url = r.next_page_url;
	}
	return out.map((x) => x.id);
}
const small = (n) => ({ params: [{ key: 'limit', value: String(n) }] });
const cases = [
	{ name: 'equipment: filter+fields, pages of 7', params: { resource: 'equipment', operation: 'getAll', returnAll: true, filters: { type: 'item', fields: 'id,displayname' }, customQueryParams: small(7) }, expect: '/equipment?type=item&fields=id' },
	{ name: 'equipment: sort -id, pages of 30', params: { resource: 'equipment', operation: 'getAll', returnAll: true, filters: { sort: '-id' }, customQueryParams: small(30) }, expect: '/equipment?sort=-id&fields=id', ordered: true },
	{ name: 'projectStatus: pages of 2', params: { resource: 'projectStatus', operation: 'getAll', returnAll: true, customQueryParams: small(2) }, expect: '/projectstatuses?fields=id' },
	{ name: 'crew: active filter+expand, pages of 5', params: { resource: 'crew', operation: 'getAll', returnAll: true, filters: { active: true }, expand: 'creator', customQueryParams: small(5) }, expect: '/crew?active=1&fields=id' },
	{ name: 'contact: default page size', params: { resource: 'contact', operation: 'getAll', returnAll: true }, expect: '/contacts?fields=id' },
	{ name: 'equipmentSetsContent (buildCrud): pages of 20', params: { resource: 'equipmentSetsContent', operation: 'getAll', returnAll: true, customQueryParams: small(20) }, expect: '/equipmentsetscontent?fields=id' },
	{ name: 'file (buildReadOnly): pages of 3', params: { resource: 'file', operation: 'getAll', returnAll: true, customQueryParams: small(3) }, expect: '/files?fields=id' },
];
const res = runBatch(cases, path.join(process.argv[2], 'wf'));
let bad = 0;
for (const c of cases) {
	const r = res[c.name];
	const want = apiAll(c.expect);
	const got = r.all.map((x) => x.id);
	const same = c.ordered ? JSON.stringify(got) === JSON.stringify(want) : JSON.stringify([...got].sort((a, b) => a - b)) === JSON.stringify([...want].sort((a, b) => a - b));
	const ok = r.ok && same;
	if (!ok) bad++;
	console.log(`${ok ? 'ok  ' : 'FAIL'} ${c.name}: n8n ${got.length} items, API ${want.length}${r.ok ? '' : ` (${r.error})`}`);
}
console.log(`pagination: ${cases.length - bad}/${cases.length} ok`);
