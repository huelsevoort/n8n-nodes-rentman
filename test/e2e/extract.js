// Pulls runData of an n8n execution out of SQLite and pairs each node with the request the mock saw.
const { parse } = require(process.env.N8N_MODS + '/flatted');
const Database = require(process.env.N8N_MODS + '/sqlite3').Database;
const fs = require('fs');
const [execId, reqFile, outFile] = process.argv.slice(2);
const db = new Database(process.env.N8N_USER_FOLDER + '/.n8n/database.sqlite');
db.get('select data, workflowData from execution_data where executionId=?', [execId], (err, row) => {
	if (err) throw err;
	const data = parse(row.data);
	const wf = JSON.parse(row.workflowData);
	const order = wf.nodes.filter((n) => n.name !== 'Start').map((n) => n.name);
	const reqs = fs.readFileSync(reqFile, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
	const rd = data.resultData.runData;
	const out = {};
	let ri = 0;
	for (const name of order) {
		const run = rd[name]?.[0];
		const o = { ran: !!run };
		if (run?.error) o.error = run.error.message + (run.error.description ? ' | ' + run.error.description : '');
		const item = run?.data?.main?.[0]?.[0]?.json;
		if (item?.error) o.error = typeof item.error === 'string' ? item.error : JSON.stringify(item.error);
		o.echo = item?._echo;
		o.items = run?.data?.main?.[0]?.length ?? 0;
		// The chain is sequential and every node sends exactly one request, so requests line up with nodes.
		o.requests = [reqs[ri++]];
		if (o.echo && JSON.stringify(o.echo) !== JSON.stringify(o.requests[0])) o.error = (o.error || '') + ' request/echo mismatch';
		o.deleteOk = !!run && !o.error;
		out[name] = o;
	}
	if (ri !== reqs.length) console.error(`WARN request count ${reqs.length} != nodes ${ri}`);
	fs.writeFileSync(outFile, JSON.stringify(out, null, 1));
	console.log(`execution ${execId}: ${order.length} nodes, ${reqs.length} requests, status ${data.resultData.error ? 'error' : 'ok'}`);
});
