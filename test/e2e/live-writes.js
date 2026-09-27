// Live check of every create/update/delete operation of the node against the real Rentman API, inside n8n.
// Usage: node live-writes.js <outDir>   (env from env.sh; RENTMAN_API_TOKEN for direct API calls)
//
// Everything created is named "n8n-e2e TEST" and written to <outDir>/created.json as it happens.
// Records Rentman cannot delete through the API (project, equipment, folder, leave mutation,
// leave request, payment) are listed at the end for manual removal.
// References to pre-existing records (crew, contacts, equipment, statuses ...) are looked up at start.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { runBatch } = require('./live-lib');
const repo = path.join(__dirname, '../..');
const { Rentman } = require(path.join(repo, 'dist/nodes/Rentman/Rentman.node.js'));
const { withUtcOffset } = require(path.join(repo, 'dist/nodes/Rentman/descriptions/shared.js'));
const description = new Rentman().description;
const TZ = process.env.GENERIC_TIMEZONE || 'America/New_York';
// Body key a node parameter is sent as, read from the node description itself.
function bodyKey(resource, operation, name) {
	const vis = (p) => { const s = p.displayOptions?.show; return !s || ((!s.resource || s.resource.includes(resource)) && (!s.operation || s.operation.includes(operation))); };
	for (const p of description.properties) {
		if (!vis(p)) continue;
		const cands = p.type === 'collection' ? p.options : [p];
		for (const o of cands) if (o.name === name && o.routing?.request?.body) return Object.keys(o.routing.request.body)[0];
	}
	return name;
}

const outDir = process.argv[2];
fs.mkdirSync(outDir, { recursive: true });
const ledgerFile = path.join(outDir, 'created.json');
const ledger = fs.existsSync(ledgerFile) ? JSON.parse(fs.readFileSync(ledgerFile, 'utf8')) : [];
const saveLedger = () => fs.writeFileSync(ledgerFile, JSON.stringify(ledger, null, 1));
const T = 'n8n-e2e TEST';

function api(method, p, body) {
	const args = ['-sS', '-X', method, `https://api.rentman.net${p}`, '-H', 'Content-Type: application/json'];
	if (process.env.RENTMAN_API_TOKEN) args.push('-H', `Authorization: Bearer ${process.env.RENTMAN_API_TOKEN}`);
	if (body) args.push('--data', JSON.stringify(body));
	args.push('-w', '\n%{http_code}');
	const out = execFileSync('curl', args, { maxBuffer: 1 << 28 }).toString();
	const i = out.lastIndexOf('\n');
	const status = Number(out.slice(i + 1));
	let json;
	try { json = JSON.parse(out.slice(0, i)); } catch { json = out.slice(0, i); }
	return { status, json };
}
const firstId = (coll, q = '') => api('GET', `${coll}?limit=1&sort=%2Bid${q}`).json.data?.[0]?.id;

// ── existing records we only reference ────────────────────────────────────────
const ref = {
	crew: `/crew/${firstId('/crew', '&active=1')}`,
	inactiveCrew: `/crew/${firstId('/crew', '&active=0')}`,
	contact: `/contacts/${firstId('/contacts')}`,
	eqA: `/equipment/${firstId('/equipment', '&type=item')}`,
	eqB: `/equipment/${api('GET', '/equipment?limit=2&sort=%2Bid&type=item').json.data[1].id}`,
	leavetypeWork: `/leavetypes/${firstId('/leavetypes')}`,
	leavetype: `/leavetypes/${api('GET', '/leavetypes?limit=2&sort=%2Bid').json.data[1].id}`,
	stockLocationId: String(firstId('/stocklocations')),
	factorgroup: `/factorgroups/${firstId('/factorgroups')}`,
	taxclass: `/taxclasses/${firstId('/taxclasses')}`,
	ledger: `/ledgercodes/${firstId('/ledgercodes')}`,
	folderEq: `/folders/${firstId('/folders', '&itemtype=equipment')}`,
	folderVeh: `/folders/${firstId('/folders', '&itemtype=vehicle')}`,
	projecttype: `/projecttypes/${firstId('/projecttypes')}`,
	projectstatus: `/projectstatuses/${firstId('/projectstatuses')}`,
	invoiceId: firstId('/invoices'),
};

const results = [];
function record(name, r, extra = {}) {
	results.push({ name, ok: r.ok, error: r.error, id: r.first?.id, ...extra });
	console.log(`${r.ok ? 'ok  ' : 'FAIL'} ${name}${r.ok ? ` -> id ${r.first?.id ?? '-'}` : `: ${r.error}`}`);
}
function track(kind, id, deletable, via) {
	if (id === undefined || id === null) return;
	ledger.push({ kind, id, deletable, via, deleted: false });
	saveLedger();
}
function run(cases) {
	const res = runBatch(cases, path.join(outDir, 'wf'));
	for (const c of cases) {
		const r = res[c.name];
		if (c.track && r.ok) track(c.track[0], r.first?.id, c.track[1], 'node');
		record(c.name, r);
		c.result = r;
	}
	return Object.fromEntries(cases.map((c) => [c.name, c.result]));
}
const idOf = (r) => (r?.ok ? String(r.first.id) : undefined);

// ── W1: creates without dependencies ─────────────────────────────────────────
const d1 = '2027-03-01T09:00:00';
const d2 = '2027-03-01T17:00:00';
const w1 = run([
	{ name: 'contact.create.min', params: { resource: 'contact', operation: 'create', name: `${T} contact min` }, track: ['contacts', true] },
	{ name: 'contact.create.full', track: ['contacts', true], params: { resource: 'contact', operation: 'create', name: `${T} contact full`, additionalFields: {
		accounting_code: 'E2E-ACC', mailing_city: 'Berlin', visit_city: 'Hamburg', code: 'E2E-C1', mailing_country: 'de', visit_country: 'nl', email_1: 'e2e@example.com',
		firstname: 'Max', surname: 'Muster', phone_1: '+49 30 111', phone_2: '+49 30 222', mailing_postalcode: '10115', visit_postalcode: '20095', projectnote: 'e2e note',
		mailing_street: 'Teststr.', visit_street: 'Hafenweg', type: 'company', VAT_code: 'DE123456789', website: 'https://example.com' } } },
	{ name: 'appointment.create.min', track: ['appointments', true], params: { resource: 'appointment', operation: 'create', start: d1, end: d2 } },
	{ name: 'appointment.create.full', track: ['appointments', true], params: { resource: 'appointment', operation: 'create', start: d1, end: d2, additionalFields: { name: `${T} appointment`, remark: 'e2e' } } },
	{ name: 'crewAvailability.create.full', track: ['crewavailability', true], params: { resource: 'crewAvailability', operation: 'create', crewmember: ref.crew, start: d1, end: d2, additionalFields: { remark: T, status: 'N' } } },
	{ name: 'crewAvailability.create[id only]', track: ['crewavailability', true], params: { resource: 'crewAvailability', operation: 'create', crewmember: ref.crew.split('/')[2], start: '2027-04-01T09:00:00', end: '2027-04-01T17:00:00' } },
	{ name: 'equipment.create.full', track: ['equipment', false], params: { resource: 'equipment', operation: 'create', additionalFields: {
		code: 'E2E-EQ', critical_stock_level: 1, external_remark: 'e2e ext', factor_group: ref.factorgroup, folder: ref.folderEq, in_planner: true, in_shop: false,
		internal_remark: 'e2e int', is_combination: false, is_physical: 'Physical equipment', ledger: ref.ledger, list_price: 10, name: `${T} equipment`, price: 5,
		rental_sales: 'Rental', stock_management: 'Track stock', strict_container_content: 'Unrestricted', taxclass: ref.taxclass, type: 'item', unit: 'Stk' } } },
	{ name: 'folder.create.full', track: ['folders', false], params: { resource: 'folder', operation: 'create', additionalFields: { itemtype: 'equipment', name: `${T} folder`, order: '99', parent: ref.folderEq } } },
	{ name: 'leaveMutation.create.full', track: ['leavemutation', false], params: { resource: 'leaveMutation', operation: 'create', crewmember: ref.inactiveCrew, leavetype: ref.leavetype, duration: 1, mutation_date: '2027-03-01T00:00:00', additionalFields: { remark: T } } },
	{ name: 'leaveRequest.create.full', track: ['leaverequest', false], params: { resource: 'leaveRequest', operation: 'create', requested_for: ref.crew, approval_status: 'pending', additionalFields: { description: T } } },
	{ name: 'project.create.full', track: ['projects', false], params: { resource: 'project', operation: 'create', name: `${T} project`, additionalFields: { reference: 'E2E-REF', number: `E2E-${Date.now() % 100000}` } } },
	{ name: 'projectRequest.create.min', track: ['projectrequests', true], params: { resource: 'projectRequest', operation: 'create', name: `${T} request min`, planperiod_start: d1, planperiod_end: d2 } },
	{ name: 'projectRequest.create.full', track: ['projectrequests', true], params: { resource: 'projectRequest', operation: 'create', name: `${T} request full`, planperiod_start: d1, planperiod_end: d2, additionalFields: { customer: ref.contact, remark: 'e2e' } } },
	{ name: 'task.create.full', track: ['tasks', true], params: { resource: 'task', operation: 'create', color: '#00AA00', additionalFields: {
		assignment_type: 'creator_only', deadline: '2027-03-02T12:00:00', deadline_type: 'specific_date', deadline_relative_offset_amount: 1, deadline_relative_offset_base: 'start_of_period',
		deadline_relative_offset_direction: 'before', deadline_relative_offset_unit: 'days', details: 'e2e details', expiry_notification_date: '2027-03-01T12:00:00', is_template: false,
		name: `${T} task`, order: '1', priority: 'low_priority', recurperiode: 1, recurhoe: 'once', synchronization_id: 'e2e-sync', synchronization_uri: 'https://example.com/e2e', time_budget: 1 } } },
	{ name: 'taskStatus.create.full', track: ['taskstatuses', true], params: { resource: 'taskStatus', operation: 'create', color: '#00AA00', additionalFields: { name: `${T} status`, order: '99', type: 'custom' } } },
	{ name: 'timeRegistration.create.full', track: ['timeregistration', true], params: { resource: 'timeRegistration', operation: 'create', crewmember: ref.crew, start: d1, end: d2, additionalFields: { break_duration: 0, distance: 0, leavetype: ref.leavetypeWork, remark: T } } },
	{ name: 'vehicle.create.min', track: ['vehicles', true], params: { resource: 'vehicle', operation: 'create' } },
	{ name: 'vehicle.create.full', track: ['vehicles', true], params: { resource: 'vehicle', operation: 'create', additionalFields: {
		folder: ref.folderVeh, height: 2, in_planner: true, inspection_date: '2027-03-01T00:00:00', length: 5, licenseplate: 'E2E-1', multiple: 'plannable_once', name: `${T} vehicle`,
		payload_capacity: 100, remark: 'e2e', seats: 2, surface_area: '10', width: 2 } } },
	{ name: 'vehicle.createForStockLocation', track: ['vehicles', true], params: { resource: 'vehicle', operation: 'createForStockLocation', stockLocationId: ref.stockLocationId, additionalFields: { name: `${T} vehicle sl` } } },
]);

const C1 = idOf(w1['contact.create.full']);
const A1 = idOf(w1['appointment.create.full']);
const E1 = idOf(w1['equipment.create.full']);
const T1 = idOf(w1['task.create.full']);
const PR1 = idOf(w1['projectRequest.create.full']) || idOf(w1['projectRequest.create.min']);
const P1 = idOf(w1['project.create.full']);

// Records the node has no create operation for: made directly via the API so update/delete can be tested.
function helper(kind, p, body, deletable) {
	const r = api('POST', p, body);
	const ok = r.status < 300;
	console.log(`${ok ? 'ok  ' : 'FAIL'} helper POST ${p}${ok ? ` -> id ${r.json.data.id}` : `: ${r.status} ${JSON.stringify(r.json).slice(0, 200)}`}`);
	if (!ok) return undefined;
	track(kind, r.json.data.id, deletable, 'helper');
	return String(r.json.data.id);
}
const CP1 = C1 && helper('contactpersons', `/contacts/${C1}/contactpersons`, { firstname: 'n8n-e2e', lastname: 'TEST' }, true);
const AC1 = A1 && helper('appointmentcrew', `/appointments/${A1}/appointmentcrew`, { crew: ref.crew }, true);
const PRE1 = PR1 && helper('projectrequestequipment', `/projectrequests/${PR1}/projectrequestequipment`, { name: T, quantity: 1 }, true);
const P1sub = P1 && api('GET', `/projects/${P1}/subprojects?limit=1`).json.data?.[0]?.id;
const CO1 = P1sub && helper('costs', `/projects/${P1}/costs`, { name: T, subproject: `/subprojects/${P1sub}` }, true);
const SM1 = E1 && helper('stockmovements', `/equipment/${E1}/stockmovements`, { amount: 1, date: '2027-03-01T00:00:00+01:00', stock_location: `/stocklocations/${ref.stockLocationId}`, description: T }, true);
const PAY1 = helper('payments', `/invoices/${ref.invoiceId}/payments`, { moment: '2027-03-01T00:00:00+01:00', amount: 0, description: T }, false);

// ── W2: creates that hang off W1 records ─────────────────────────────────────
const parents = ['contacts', 'contactpersons', 'contracts', 'crew', 'equipment', 'invoices', 'projects', 'purchaseorders', 'quotes', 'repairs', 'serialnumbers', 'subrentals', 'suppliers', 'vehicles'];
const parentIds = { contacts: C1, contactpersons: CP1, crew: ref.crew.split('/')[2], equipment: E1, projects: P1 };
for (const p of parents) if (!parentIds[p]) parentIds[p] = firstId(`/${p}`);
const w2cases = [
	{ name: 'accessory.create.full', track: ['accessories', true], params: { resource: 'accessory', operation: 'create', equipmentId: E1, additionalFields: { add_as_new_line: false, automatic: true, equipment: ref.eqA, is_free: false, order: '1', quantity: 1, skip: false } } },
	{ name: 'alternative.create', track: ['alternatives', true], params: { resource: 'alternative', operation: 'create', equipmentId: E1, alternative: ref.eqA } },
	{ name: 'equipmentSetsContent.create.full', track: ['equipmentsetscontent', true], params: { resource: 'equipmentSetsContent', operation: 'create', equipmentId: E1, setContentEquipment: ref.eqA, additionalFields: { is_fixed: 'Reserved from stock', is_physically_connected: 'Will remain in the combination when emptying combinations', order: '1', quantity: '1' } } },
	{ name: 'serialNumber.create.full', track: ['serialnumbers', true], params: { resource: 'serialNumber', operation: 'create', equipmentId: E1, additionalFields: { active: true, asset_location: `/stocklocations/${ref.stockLocationId}`, book_value: 1, depreciation_monthly: 0, purchase_costs: 1, purchasedate: '2027-01-01T00:00:00', ref: 'E2E', remark: T, residual_value: 0, serial: 'E2E-SN-1' } } },
	{ name: 'supplier.create.full', track: ['suppliers', true], params: { resource: 'supplier', operation: 'create', equipmentId: E1, contact: `/contacts/${C1}`, additionalFields: { contactperson: CP1 ? `/contactpersons/${CP1}` : undefined, details: 'e2e', price: 1 } } },
	{ name: 'task.createSubtask', track: ['subtasks', true], params: { resource: 'task', operation: 'createSubtask', taskId: T1, subtaskTitle: `${T} subtask`, subtaskCompleted: false } },
	{ name: 'task.createTaskAssignment', track: ['taskassignments', true], params: { resource: 'task', operation: 'createTaskAssignment', taskId: T1, assigneeCrew: ref.crew } },
];
for (const p of parents) {
	if (!parentIds[p]) { results.push({ name: `task.createForParent[${p}]`, ok: null, error: `no ${p} record in account` }); continue; }
	w2cases.push({ name: `task.createForParent[${p}]`, track: ['tasks', true], params: { resource: 'task', operation: 'createForParent', parentResource: p, parentId: String(parentIds[p]), color: '#00AA00', additionalFields: { name: `${T} task on ${p}` } } });
}
const w2 = run(w2cases.filter((c) => {
	const missing = Object.entries(c.params).some(([k, v]) => v === undefined);
	if (missing) { results.push({ name: c.name, ok: null, error: 'prerequisite record could not be created' }); console.log(`SKIP ${c.name}: prerequisite record missing`); }
	return !missing;
}));
const ACC = idOf(w2['accessory.create.full']);
const ALT = idOf(w2['alternative.create']);
const ESC = idOf(w2['equipmentSetsContent.create.full']);
const SN = idOf(w2['serialNumber.create.full']);
const SUP = idOf(w2['supplier.create.full']);
const ST1 = idOf(w2['task.createSubtask']);
const TA1 = idOf(w2['task.createTaskAssignment']);
// Reads of resources that may only exist because this run created them (e.g. subtasks).
if (ST1) {
	run([
		{ name: 'subtask.get', params: { resource: 'subtask', operation: 'get', subtaskId: ST1 } },
		{ name: 'subtask.getAll', params: { resource: 'subtask', operation: 'getAll', returnAll: false, limit: 5, filters: { task: `/tasks/${T1}` } } },
		{ name: 'task.getSubtasks', params: { resource: 'task', operation: 'getSubtasks', taskId: T1 } },
		{ name: 'task.getTaskAssignments', params: { resource: 'task', operation: 'getTaskAssignments', taskId: T1 } },
	]);
}
const CA1 = idOf(w1['crewAvailability.create.full']);
const F1 = idOf(w1['folder.create.full']);
const LR1 = idOf(w1['leaveRequest.create.full']);
const TS1 = idOf(w1['taskStatus.create.full']);
const TR1 = idOf(w1['timeRegistration.create.full']);
const V1 = idOf(w1['vehicle.create.full']);

// ── W3: updates, then read back and compare every field that was sent ───────
const d3 = '2027-03-02T10:00:00';
const d4 = '2027-03-02T18:00:00';
const u = (name, resource, idParam, id, coll, params) => ({ name, coll, id, params: { resource, operation: 'update', [idParam]: id, ...params } });
const w3cases = [
	u('accessory.update', 'accessory', 'accessoryId', ACC, 'accessories', { updateFields: { add_as_new_line: true, automatic: false, equipment: ref.eqB, is_free: true, order: '2', quantity: 2, skip: true } }),
	u('alternative.update', 'alternative', 'alternativeId', ALT, 'alternatives', { alternative: ref.eqB }),
	u('appointment.update', 'appointment', 'appointmentId', A1, 'appointments', { start: d3, end: d4, updateFields: { name: `${T} appointment upd`, remark: 'e2e upd' } }),
	u('appointmentCrew.update', 'appointmentCrew', 'appointmentCrewId', AC1, 'appointmentcrew', { crew: ref.crew }),
	u('contact.update', 'contact', 'contactId', C1, 'contacts', { updateFields: {
		accounting_code: 'E2E-ACC2', mailing_city: 'Köln', visit_city: 'Bonn', code: 'E2E-C2', email_1: 'e2e2@example.com', firstname: 'Erika', surname: 'Musterfrau', name: `${T} contact upd`,
		phone_1: '+49 221 1', phone_2: '+49 221 2', projectnote: 'e2e note 2', mailing_street: 'Domplatz', type: 'private', VAT_code: 'DE987654321', website: 'https://example.org' } }),
	u('contactPerson.update', 'contactPerson', 'contactPersonId', CP1, 'contactpersons', { updateFields: { city: 'Berlin', country: 'de', email: 'cp@example.com', firstname: 'n8n-e2e upd', function: 'Tester', number: '1a', surname: 'TEST upd', middle_name: 'van', mobile: '+49 170 1', phone: '+49 30 3', postalcode: '10115', state: 'BE', street: 'Teststr.' } }),
	u('cost.update', 'cost', 'costId', CO1, 'costs', { subproject: P1sub ? `/subprojects/${P1sub}` : '', updateFields: { name: `${T} cost upd`, remark: 'e2e upd' } }),
	u('crewAvailability.update', 'crewAvailability', 'crewAvailabilityId', CA1, 'crewavailability', { start: d3, end: d4, updateFields: { remark: `${T} upd`, status: 'B' } }),
	u('equipment.update', 'equipment', 'equipmentId', E1, 'equipment', { additionalFields: {
		code: 'E2E-EQ2', critical_stock_level: 2, external_remark: 'e2e ext 2', in_planner: false, in_shop: true, internal_remark: 'e2e int 2', list_price: 11, name: `${T} equipment upd`, price: 6,
		rental_sales: 'Sale', unit: 'Pcs' } }),
	u('equipmentSetsContent.update', 'equipmentSetsContent', 'equipmentSetsContentId', ESC, 'equipmentsetscontent', { setContentEquipment: ref.eqB, updateFields: { is_fixed: 'Available outside this combination', is_physically_connected: 'Will be removed when emptying combinations', order: '2', quantity: '2' } }),
	u('folder.update', 'folder', 'folderId', F1, 'folders', { additionalFields: { itemtype: 'equipment', name: `${T} folder upd`, order: '98', parent: ref.folderEq } }),
	u('leaveRequest.update', 'leaveRequest', 'leaveRequestId', LR1, 'leaverequest', { requested_for: ref.crew, updateFields: { approval_status: 'canceled', description: `${T} upd` } }),
	u('payment.update', 'payment', 'paymentId', PAY1, 'payments', { moment: '2027-03-02T00:00:00', updateFields: { amount: 0, remark: `${T} upd`, payment_import_source: 'publicapi' } }),
	u('projectRequest.update', 'projectRequest', 'projectRequestId', PR1, 'projectrequests', { planperiod_start: d3, planperiod_end: d4, updateFields: { name: `${T} request upd`, remark: 'e2e upd' } }),
	u('projectRequestEquipment.update', 'projectRequestEquipment', 'projectRequestEquipmentId', PRE1, 'projectrequestequipment', { updateFields: { quantity: 2, remark: 'e2e upd' } }),
	u('serialNumber.update', 'serialNumber', 'serialNumberId', SN, 'serialnumbers', { updateFields: { active: false, book_value: 2, depreciation_monthly: 1, purchase_costs: 2, purchasedate: '2027-01-02T00:00:00', ref: 'E2E2', remark: `${T} upd`, residual_value: 1, serial: 'E2E-SN-2' } }),
	u('stockMovement.update', 'stockMovement', 'stockMovementId', SM1, 'stockmovements', { date: '2027-03-02T00:00:00', updateFields: { quantity: 2, remark: `${T} upd`, details: 'e2e', stock_location: `/stocklocations/${ref.stockLocationId}` } }),
	u('subtask.update', 'subtask', 'subtaskId', ST1, 'subtasks', { updateFields: { completed: true, title: `${T} subtask upd` } }),
	u('supplier.update', 'supplier', 'supplierId', SUP, 'suppliers', { contact: `/contacts/${C1}`, updateFields: { details: 'e2e upd', price: 2 } }),
	u('task.update', 'task', 'taskId', T1, 'tasks', { color: '#AA0000', additionalFields: { name: `${T} task upd`, details: 'e2e upd', priority: 'high_priority', completed_by: ref.crew, completed_at: '2027-03-02T12:00:00' } }),
	u('taskAssignment.update', 'taskAssignment', 'taskAssignmentId', TA1, 'taskassignments', { crew: ref.crew }),
	u('taskStatus.update', 'taskStatus', 'taskStatusId', TS1, 'taskstatuses', { color: '#AA0000', additionalFields: { name: `${T} status upd`, order: '98', type: 'custom' } }),
	u('timeRegistration.update', 'timeRegistration', 'timeRegId', TR1, 'timeregistration', { updateFields: { break_duration: 1, distance: 1, start: d3, end: d4, remark: `${T} upd` } }),
	u('vehicle.update', 'vehicle', 'vehicleId', V1, 'vehicles', { updateFields: { height: 3, in_planner: false, length: 6, licenseplate: 'E2E-2', multiple: 'plannable_multi', name: `${T} vehicle upd`, payload_capacity: 200, remark: 'e2e upd', seats: 3, surface_area: '12', width: 3 } }),
	u('equipment.update[type=case]', 'equipment', 'equipmentId', E1, 'equipment', { additionalFields: { type: 'case' } }),
	u('equipment.update[type=set]', 'equipment', 'equipmentId', E1, 'equipment', { additionalFields: { type: 'set' } }),
	u('equipment.update[is_physical,is_combination,strict]', 'equipment', 'equipmentId', E1, 'equipment', { additionalFields: { is_physical: 'Virtual package', is_combination: true, strict_container_content: 'Strict' } }),
	u('equipment.update[type=item]', 'equipment', 'equipmentId', E1, 'equipment', { additionalFields: { type: 'item' } }),
	u('equipment.update[stock_management]', 'equipment', 'equipmentId', E1, 'equipment', { additionalFields: { stock_management: 'Exclude from stock tracking' } }),
];
const runnable = w3cases.filter((c) => {
	if (c.id) return true;
	results.push({ name: c.name, ok: null, error: 'prerequisite record could not be created' });
	console.log(`SKIP ${c.name}: prerequisite record missing`);
	return false;
});
// Each update runs alone so that sequential updates of the same record read back cleanly.
const w3 = {};
// Read back: which sent fields did Rentman actually store?
const sameVal = (a, b) => {
	if (a === b) return true;
	if (typeof a === 'string' && typeof b === 'string' && /^\d{4}-\d\d-\d\dT/.test(a)) return new Date(b).getTime() === new Date(withUtcOffset(a, TZ)).getTime();
	if (typeof a === 'string' && typeof b === 'string' && /^#/.test(a)) return a.replace('#', '').toLowerCase() === b.replace('#', '').toLowerCase();
	if (typeof b === 'number') return Number(a) === b;
	if (typeof b === 'boolean') return a === b;
	return String(a) === String(b);
};
const ignored = {};
for (const c of runnable) {
	Object.assign(w3, run([c]));
	if (!w3[c.name].ok) continue;
	// Read back straight away: a later update (e.g. equipment stock tracking) can remove the record.
	const rec = api('GET', `/${c.coll}/${c.id}`).json.data;
	if (!rec) { ignored[c.name] = ['record not readable after update']; continue; }
	const sent = { ...(c.params.updateFields || {}), ...(c.params.additionalFields || {}) };
	for (const k of ['start', 'end', 'alternative', 'requested_for', 'subproject', 'planperiod_start', 'planperiod_end', 'crew', 'setContentEquipment', 'moment', 'date', 'color', 'contact']) if (k in c.params) sent[k] = c.params[k];
	const miss = [];
	for (const [k, v] of Object.entries(sent)) {
		const bk = bodyKey(c.params.resource, 'update', k);
		if (!(bk in rec)) miss.push(`${k}→${bk} (not in response)`);
		else if (!sameVal(v, rec[bk])) miss.push(`${k}→${bk}: sent ${JSON.stringify(v)}, stored ${JSON.stringify(rec[bk])}`);
	}
	if (miss.length) ignored[c.name] = miss;
}

// ── W4: deletes of everything deletable (node deletes; helper-only kinds too) ──
const del = (name, resource, idParam, id) => ({ name, id, params: { resource, operation: 'delete', [idParam]: id } });
const taskIds = ledger.filter((l) => l.kind === 'tasks' && !l.deleted).map((l) => String(l.id));
const w4cases = [
	del('subtask.delete', 'subtask', 'subtaskId', ST1),
	del('taskAssignment.delete', 'taskAssignment', 'taskAssignmentId', TA1),
	...taskIds.map((id, i) => del(i === 0 ? 'task.delete' : `task.delete#${id}`, 'task', 'taskId', id)),
	del('taskStatus.delete', 'taskStatus', 'taskStatusId', TS1),
	del('accessory.delete', 'accessory', 'accessoryId', ACC),
	del('alternative.delete', 'alternative', 'alternativeId', ALT),
	del('equipmentSetsContent.delete', 'equipmentSetsContent', 'equipmentSetsContentId', ESC),
	del('serialNumber.delete', 'serialNumber', 'serialNumberId', SN),
	del('supplier.delete', 'supplier', 'supplierId', SUP),
	del('stockMovement.delete', 'stockMovement', 'stockMovementId', SM1),
	del('cost.delete', 'cost', 'costId', CO1),
	del('appointmentCrew.delete', 'appointmentCrew', 'appointmentCrewId', AC1),
	...ledger.filter((l) => l.kind === 'appointments' && !l.deleted).map((l, i) => del(i === 0 ? 'appointment.delete' : `appointment.delete#${l.id}`, 'appointment', 'appointmentId', String(l.id))),
	del('contactPerson.delete', 'contactPerson', 'contactPersonId', CP1),
	del('projectRequestEquipment.delete', 'projectRequestEquipment', 'projectRequestEquipmentId', PRE1),
	...ledger.filter((l) => l.kind === 'projectrequests' && !l.deleted).map((l, i) => del(i === 0 ? 'projectRequest.delete' : `projectRequest.delete#${l.id}`, 'projectRequest', 'projectRequestId', String(l.id))),
	...ledger.filter((l) => l.kind === 'crewavailability' && !l.deleted).map((l, i) => del(i === 0 ? 'crewAvailability.delete' : `crewAvailability.delete#${l.id}`, 'crewAvailability', 'crewAvailabilityId', String(l.id))),
	del('timeRegistration.delete', 'timeRegistration', 'timeRegId', TR1),
	...ledger.filter((l) => l.kind === 'vehicles' && !l.deleted).map((l, i) => del(i === 0 ? 'vehicle.delete' : `vehicle.delete#${l.id}`, 'vehicle', 'vehicleId', String(l.id))),
	...ledger.filter((l) => l.kind === 'contacts' && !l.deleted).map((l, i) => del(i === 0 ? 'contact.delete' : `contact.delete#${l.id}`, 'contact', 'contactId', String(l.id))),
].filter((c) => c.id);
const w4 = {};
for (const c of w4cases) Object.assign(w4, run([c])); // one at a time: order matters (children before parents)
// verify deletion
const kindOf = { subtask: 'subtasks', taskAssignment: 'taskassignments', task: 'tasks', taskStatus: 'taskstatuses', accessory: 'accessories', alternative: 'alternatives', equipmentSetsContent: 'equipmentsetscontent', serialNumber: 'serialnumbers', supplier: 'suppliers', stockMovement: 'stockmovements', cost: 'costs', appointmentCrew: 'appointmentcrew', appointment: 'appointments', contactPerson: 'contactpersons', projectRequestEquipment: 'projectrequestequipment', projectRequest: 'projectrequests', crewAvailability: 'crewavailability', timeRegistration: 'timeregistration', vehicle: 'vehicles', contact: 'contacts' };
for (const c of w4cases) {
	const kind = kindOf[c.params.resource];
	const gone = api('GET', `/${kind}/${c.id}`).status === 404;
	const l = ledger.find((x) => x.kind === kind && String(x.id) === String(c.id));
	if (l) l.deleted = gone;
	if (w4[c.name].ok && !gone) { const r = results.find((x) => x.name === c.name); r.ok = false; r.error = 'reported success but record still exists'; }
}
saveLedger();

fs.writeFileSync(path.join(outDir, 'writes.json'), JSON.stringify({ results, ignored, ref }, null, 1));
console.log('\nFields sent but not stored:');
for (const [k, v] of Object.entries(ignored)) console.log(`  ${k}: ${v.join('; ')}`);
console.log('\nLeft in the account:');
for (const l of ledger.filter((x) => !x.deleted)) console.log(`  /${l.kind}/${l.id}${l.deletable ? ' (deletable, cleanup failed)' : ' (no API delete)'}`);
const bad = results.filter((r) => r.ok === false);
console.log(`\nwrites: ${results.length} runs, ${results.filter((r) => r.ok).length} ok, ${bad.length} failed, ${results.filter((r) => r.ok === null).length} not runnable`);
