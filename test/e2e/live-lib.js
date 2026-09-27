// Runs Rentman node operations inside a real n8n instance against the live Rentman API.
// Each batch becomes one workflow: every case is its own node hanging off the manual trigger,
// with "On Error: Continue" so one failing operation does not stop the rest.
// Requires env.sh-style variables: N8N, N8N_MODS, N8N_USER_FOLDER (see env.example.sh).
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const N8N = process.env.N8N;
const credential = { rentmanApi: { id: 'rentmanLive', name: 'Rentman Live' } };
let counter = 0;

function workflow(id, cases) {
	const nodes = [{ id: 'trigger', name: 'Start', type: 'n8n-nodes-base.manualTrigger', typeVersion: 1, position: [0, 0], parameters: {} }];
	const connections = { Start: { main: [[]] } };
	cases.forEach((c, i) => {
		nodes.push({
			id: `n${i}`,
			name: c.name,
			type: 'n8n-nodes-rentman.rentman',
			typeVersion: 1,
			position: [300, i * 120],
			parameters: c.params,
			credentials: credential,
			onError: 'continueRegularOutput',
			alwaysOutputData: true,
			executeOnce: true,
		});
		connections.Start.main[0].push({ node: c.name, type: 'main', index: 0 });
	});
	return { id, name: id, active: false, settings: { executionOrder: 'v1' }, pinData: {}, nodes, connections };
}

function readExecution(execId) {
	const { parse } = require(process.env.N8N_MODS + '/flatted');
	const out = execFileSync('python3', [
		'-c',
		'import sqlite3,sys,json;r=sqlite3.connect(sys.argv[1]).execute("select data from execution_data where executionId=?",(sys.argv[2],)).fetchone();print(r[0])',
		process.env.N8N_USER_FOLDER + '/.n8n/database.sqlite',
		String(execId),
	], { maxBuffer: 1 << 30 }).toString();
	return parse(out);
}

function lastExecutionId() {
	return execFileSync('python3', ['-c', 'import sqlite3,sys;print(sqlite3.connect(sys.argv[1]).execute("select max(id) from execution_entity").fetchone()[0])', process.env.N8N_USER_FOLDER + '/.n8n/database.sqlite']).toString().trim();
}

// Parameters n8n drops when it loads the workflow (unknown or hidden keys) never reach Rentman, so a
// case that sets one would test less than it claims. Returns the dropped parameter paths.
let description;
function droppedParams(params) {
	const { NodeHelpers } = require(path.join(process.env.N8N_MODS, 'n8n-workflow'));
	description ??= new (require(path.join(process.env.N8N_USER_FOLDER, '.n8n/nodes/node_modules/n8n-nodes-rentman/dist/nodes/Rentman/Rentman.node.js')).Rentman)().description;
	const node = { id: 'x', name: 'x', type: 'n8n-nodes-rentman.rentman', typeVersion: 1, position: [0, 0], parameters: {} };
	const kept = NodeHelpers.getNodeParameters(description.properties, params, true, false, node, description) || {};
	const dropped = [];
	const walk = (given, have, pre) => {
		for (const [k, v] of Object.entries(given)) {
			if (v === undefined) continue;
			if (!have || !(k in have)) dropped.push(pre + k);
			else if (v && typeof v === 'object' && !Array.isArray(v)) walk(v, have[k], `${pre}${k}.`);
		}
	};
	walk(params, kept, '');
	return dropped;
}

/** Runs cases [{name, params}] and returns {name: {ok, error, items, first}}. */
function runBatch(cases, dir) {
	const id = `rentmanLive${Date.now()}${counter++}`;
	fs.mkdirSync(dir, { recursive: true });
	const file = path.join(dir, `${id}.json`);
	fs.writeFileSync(file, JSON.stringify(workflow(id, cases)));
	execFileSync(N8N, ['import:workflow', `--input=${file}`], { stdio: 'pipe' });
	try {
		execFileSync(N8N, ['execute', `--id=${id}`], { stdio: 'pipe', maxBuffer: 1 << 30 });
	} catch (e) {
		// n8n exits non-zero when any node errored even with continueOnFail; results are still stored.
	}
	const data = readExecution(lastExecutionId());
	const rd = data.resultData.runData;
	const res = {};
	for (const c of cases) {
		const run = rd[c.name]?.[0];
		const items = run?.data?.main?.[0] || [];
		const first = items[0]?.json;
		let error;
		const dropped = droppedParams(c.params);
		if (dropped.length) error = `test case sets parameters the node does not have: ${dropped.join(', ')}`;
		else if (!run) error = 'node did not run';
		else if (run.error) error = run.error.message + (run.error.description ? ' | ' + run.error.description : '');
		else if (first && first.error) {
			error = typeof first.error === 'string' ? first.error : JSON.stringify(first.error);
			// Rentman's own reason travels in the item's NodeApiError context, not in json.error
			const body = items[0].error?.context?.data;
			const reason = body?.errorMessage ?? body?.message ?? body?.validation;
			if (reason) error += ` | ${typeof reason === 'string' ? reason : JSON.stringify(reason)}`;
		}
		res[c.name] = { ok: !error, error, items: items.length, first, all: items.map((i) => i.json) };
	}
	return res;
}

module.exports = { runBatch };
