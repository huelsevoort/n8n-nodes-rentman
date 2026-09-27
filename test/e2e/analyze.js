// Checks n8n execution results (exported executions) against expectations.json.
const fs = require('fs');
const path = require('path');
const dir = process.argv[2];
const cases = require(path.join(dir, 'expectations.json'));
const runData = {};
for (const f of fs.readdirSync(dir).filter((f) => f.startsWith('result'))) {
	Object.assign(runData, JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
}

const results = [];
for (const c of cases) {
	const problems = [];
	const run = runData[c.name];
	if (!run) { results.push({ ...c, ok: false, problems: ['node did not run'] }); continue; }
	if (run.error) problems.push(`error: ${run.error}`);
	const echo = run.echo;
	if (c.method === 'DELETE') {
		if (!run.error && !run.deleteOk) problems.push('delete produced no output');
		const reqs = run.requests || [];
		if (reqs.length !== 1) problems.push(`expected 1 request, saw ${reqs.length}`);
	}
	const e = echo || (run.requests && run.requests[0]);
	if (!e) { if (!run.error) problems.push('no request echo'); results.push({ ...c, ok: false, problems }); continue; }
	if (e.method !== c.method) problems.push(`method ${e.method} != ${c.method}`);
	if (/undefined|null|\{\{|\/\/|\s/.test(e.path)) problems.push(`bad path ${e.path}`);
	if ('' in (e.query || {})) problems.push('blank query key sent');
	if (e.auth !== 'Bearer mock-token') problems.push('missing auth header');
	const needsId = Object.keys(c.params).some((k) => /Id$/.test(k));
	if (needsId && !e.path.includes('101')) problems.push(`ID not in path ${e.path}`);
	if (c.variant === 'full' && ['POST', 'PUT'].includes(c.method) && (e.body === null || typeof e.body !== 'object')) problems.push('no JSON body');
	for (const x of c.expect) {
		if (x.in === 'url') {
			const want = x.expr.replace(/^=/, '').replace(/\{\{\s*\$value\s*\}\}/g, String(x.value));
			if (!want.includes('{{') && e.path !== want && !(c.variant && e.path.startsWith(want))) problems.push(`path ${e.path} != ${want}`);
			continue;
		}
		const bag = x.in === 'qs' ? e.query || {} : e.body || {};
		if (x.dynamic || x.nested) {
			if (x.key === 'custom_3' && bag.custom_3 !== 'cq_value') problems.push('custom query param missing');
			continue;
		}
		if (!(x.key in bag)) { problems.push(`${x.field} not sent as ${x.in}.${x.key}`); continue; }
		const got = bag[x.key];
		if (got && typeof got === 'object') { if (JSON.stringify(got) !== JSON.stringify(JSON.parse(x.value))) problems.push(`${x.field}: sent ${JSON.stringify(got)} expected ${x.value}`); continue; }
		if (String(got) !== String(x.value) && !(typeof x.value === 'string' && x.value.startsWith('2026') && String(got).startsWith('2026')))
			problems.push(`${x.field}: sent ${JSON.stringify(got)} expected ${JSON.stringify(x.value)}`);
	}
	results.push({ name: c.name, method: c.method, path: e.path, query: e.query, body: e.body, ok: problems.length === 0, problems });
}
fs.writeFileSync(path.join(dir, 'report.json'), JSON.stringify(results, null, 1));
const bad = results.filter((r) => !r.ok);
console.log(`${results.length - bad.length}/${results.length} cases OK`);
for (const b of bad) console.log(b.name, '→', b.problems.join('; '));
