// Deletes every deletable record listed in <outDir>/created.json that is still present,
// children first. Use after an aborted live-writes.js run.  Usage: node live-cleanup.js <outDir>
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const file = path.join(process.argv[2], 'created.json');
const ledger = JSON.parse(fs.readFileSync(file, 'utf8'));
const order = ['subtasks', 'taskassignments', 'tasks', 'taskstatuses', 'accessories', 'alternatives', 'equipmentsetscontent', 'serialnumbers', 'suppliers', 'stockmovements', 'costs', 'appointmentcrew', 'appointments', 'contactpersons', 'projectrequestequipment', 'projectrequests', 'crewavailability', 'timeregistration', 'vehicles', 'contacts'];
const status = (method, p) => {
	const args = ['-sS', '-o', '/dev/null', '-w', '%{http_code}', '-X', method, `https://api.rentman.net${p}`];
	if (process.env.RENTMAN_API_TOKEN) args.push('-H', `Authorization: Bearer ${process.env.RENTMAN_API_TOKEN}`);
	return Number(execFileSync('curl', args).toString());
};
for (const kind of order) {
	for (const l of ledger.filter((x) => x.kind === kind && x.deletable && !x.deleted)) {
		if (status('GET', `/${kind}/${l.id}`) === 404) { l.deleted = true; continue; }
		const s = status('DELETE', `/${kind}/${l.id}`);
		l.deleted = status('GET', `/${kind}/${l.id}`) === 404;
		console.log(`DELETE /${kind}/${l.id} -> ${s}${l.deleted ? '' : ' (still present)'}`);
	}
}
fs.writeFileSync(file, JSON.stringify(ledger, null, 1));
for (const l of ledger.filter((x) => !x.deleted)) console.log(`left: /${l.kind}/${l.id}${l.deletable ? '' : ' (no API delete)'}`);
