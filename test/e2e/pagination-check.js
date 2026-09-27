// Checks the Return All run of pagination-wf.json: each node must return the three pages the mock
// chains through next_page_url, and follow-up pages must be requested exactly as that URL says
// (Rentman rejects a cursor combined with sort, limit or offset).
const { parse } = require(process.env.N8N_MODS + '/flatted');
const { execFileSync } = require('child_process');
const fs = require('fs');
const [execId, reqFile] = process.argv.slice(2);
const db = process.env.N8N_USER_FOLDER + '/.n8n/database.sqlite';
const row = execFileSync('python3', ['-c', 'import sqlite3,sys;print(sqlite3.connect(sys.argv[1]).execute("select data from execution_data where executionId=?",(sys.argv[2],)).fetchone()[0])', db, execId], { maxBuffer: 1 << 30 }).toString();
const rd = parse(row).resultData.runData;
const reqs = fs.readFileSync(reqFile, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
const problems = [];
for (const [name, runs] of Object.entries(rd)) {
	if (name === 'Start') continue;
	const ids = (runs[0]?.data?.main?.[0] || []).map((i) => i.json.id);
	if (JSON.stringify(ids) !== '[1,2,3]') problems.push(`${name}: returned ids ${JSON.stringify(ids)}, expected [1,2,3]`);
}
for (const r of reqs.filter((r) => Number(r.query.page) > 1)) {
	const keys = Object.keys(r.query).sort().join(',');
	if (keys !== 'page,paginationtest') problems.push(`${r.path} page ${r.query.page} sent ${r.rawQuery}`);
}
if (reqs.filter((r) => Number(r.query.page) > 1).length !== 4) problems.push(`expected 4 follow-up page requests, saw ${reqs.filter((r) => Number(r.query.page) > 1).length}`);
console.log(problems.length ? `pagination: FAIL\n${problems.join('\n')}` : 'pagination: 2/2 Return All runs follow next_page_url across 3 pages');
process.exit(problems.length ? 1 : 0);
