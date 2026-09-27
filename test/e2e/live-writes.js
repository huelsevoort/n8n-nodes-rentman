// Live check of every create/update/delete operation of the node against the real Rentman API, inside n8n.
// Usage: node live-writes.js <outDir>   (env from env.sh; RENTMAN_API_TOKEN for direct API calls)
//
// Everything created is named "n8n-e2e TEST" and written to <outDir>/created.json as it happens.
// Records Rentman cannot delete through the API (project, subproject, project function (group), equipment,
// folder, leave mutation, leave request and its hours once approved, payment) are listed at the end for manual removal.
// References to pre-existing records (crew, contacts, equipment, statuses ...) are looked up at start.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { runBatch, authHeader } = require('./live-lib');
const repo = path.join(__dirname, '../..');
const { Rentman } = require(path.join(repo, 'dist/nodes/Rentman/Rentman.node.js'));
const { withUtcOffset } = require(path.join(repo, 'dist/nodes/Rentman/descriptions/shared.js'));
const description = new Rentman().description;
const TZ = process.env.GENERIC_TIMEZONE || 'America/New_York';
const outDir = process.argv[2];
fs.mkdirSync(outDir, { recursive: true });
const ledgerFile = path.join(outDir, 'created.json');
const ledger = fs.existsSync(ledgerFile) ? JSON.parse(fs.readFileSync(ledgerFile, 'utf8')) : [];
const saveLedger = () => fs.writeFileSync(ledgerFile, JSON.stringify(ledger, null, 1));
const T = 'n8n-e2e TEST';

function api(method, p, body) {
	const args = ['-sS', '-X', method, `https://api.rentman.net${p}`, '-H', 'Content-Type: application/json'];
	if (process.env.RENTMAN_API_TOKEN) args.push('-H', '@-'); // header via stdin, not visible in the process list
	if (body) args.push('--data', JSON.stringify(body));
	args.push('-w', '\n%{http_code}');
	const out = execFileSync('curl', args, { maxBuffer: 1 << 28, input: authHeader() }).toString();
	const i = out.lastIndexOf('\n');
	const status = Number(out.slice(i + 1));
	let json;
	try { json = JSON.parse(out.slice(0, i)); } catch { json = out.slice(0, i); }
	return { status, json };
}
// Writes create records in the account behind the token, some of which the API cannot delete. Show the
// account and require an explicit go: RENTMAN_LIVE_WRITE_ACK=<the account's first project name>.
{
	const project = api('GET', '/projects?limit=1&sort=%2Bid').json.data?.[0];
	const contact = api('GET', '/contacts?limit=1&sort=%2Bid').json.data?.[0];
	const account = project?.name ?? '(no project)';
	console.log(`Rentman account: first project "${account}", first contact "${contact?.displayname ?? '-'}"`);
	if (process.env.RENTMAN_LIVE_WRITE_ACK !== account) {
		console.error(`Refusing to write. Run only against a test account, then set RENTMAN_LIVE_WRITE_ACK="${account}".`);
		process.exit(2);
	}
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
	leavetypeCorrection: `/leavetypes/${api('GET', '/leavetypes?limit=100').json.data.find((t) => t.type === 'C')?.id}`,
	stockLocationId: String(firstId('/stocklocations')),
	factorgroup: `/factorgroups/${firstId('/factorgroups')}`,
	taxclass: `/taxclasses/${firstId('/taxclasses')}`,
	ledger: `/ledgercodes/${firstId('/ledgercodes')}`,
	ledgerDebit: `/ledgercodes/${firstId('/ledgercodes', '&is_debit=1')}`,
	folderEq: `/folders/${firstId('/folders', '&itemtype=equipment')}`,
	folderVeh: `/folders/${firstId('/folders', '&itemtype=vehicle')}`,
	folderContact: `/folders/${firstId('/folders', '&itemtype=contact')}`,
	projecttype: `/projecttypes/${firstId('/projecttypes')}`,
	projectstatus: `/projectstatuses/${firstId('/projectstatuses')}`,
	invoiceId: firstId('/invoices'),
	rateCost: `/rates/${firstId('/rates', '&type=cost')}`,
	ratePrice: `/rates/${firstId('/rates', '&type=price')}`,
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

// ── read back: which sent fields did Rentman actually store? ─────────────────
const ignored = {};
const sameVal = (a, b) => {
	if (a === b) return true;
	if (typeof a === 'string' && typeof b === 'string' && /^\d{4}-\d\d-\d\dT/.test(a)) return new Date(b).getTime() === new Date(withUtcOffset(a, TZ)).getTime();
	if (typeof a === 'string' && typeof b === 'string' && /^#/.test(a)) return a.replace('#', '').toLowerCase() === b.replace('#', '').toLowerCase();
	if (typeof b === 'number') return Number(a) === b;
	if (typeof b === 'boolean') return a === b;
	return String(a) === String(b);
};
// Body key of a top-level or collection parameter for this operation, or null when it is not sent in the body.
function bodyKeyOf(resource, operation, name) {
	const vis = (p) => { const s = p.displayOptions?.show; return !s || ((!s.resource || s.resource.includes(resource)) && (!s.operation || s.operation.includes(operation))); };
	for (const p of description.properties) {
		if (!vis(p)) continue;
		const cands = p.type === 'collection' ? p.options : [p];
		for (const o of cands) if (o.name === name && o.routing?.request?.body) return Object.keys(o.routing.request.body)[0];
	}
	return null;
}
function readBack(name, coll, id, params) {
	const rec = api('GET', `/${coll}/${id}`).json.data;
	if (!rec) { ignored[name] = ['record not readable after write']; return; }
	const sent = { ...(params.updateFields || {}), ...(params.additionalFields || {}) };
	for (const [k, v] of Object.entries(params)) if (!['additionalFields', 'updateFields'].includes(k) && bodyKeyOf(params.resource, params.operation, k)) sent[k] = v;
	const miss = [];
	for (const [k, v] of Object.entries(sent)) {
		if (v === undefined) continue;
		const bk = bodyKeyOf(params.resource, params.operation, k) ?? k;
		if (bk === 'custom') {
			for (const [ck, cv] of Object.entries(JSON.parse(v || '{}'))) if (!sameVal(cv, rec.custom?.[ck])) miss.push(`custom.${ck}: sent ${JSON.stringify(cv)}, stored ${JSON.stringify(rec.custom?.[ck])}`);
		} else if (!(bk in rec)) miss.push(`${k}→${bk} (not in response)`);
		else if (!sameVal(v, rec[bk])) miss.push(`${k}→${bk}: sent ${JSON.stringify(v)}, stored ${JSON.stringify(rec[bk])}`);
	}
	if (miss.length) ignored[name] = miss;
}
// Fields Rentman accepts but stores differently, each reproduced directly against the API (README.md).
// Any other difference between what was sent and what Rentman stored fails the case.
const KNOWN_NOT_STORED = [
	[/^equipment\./, 'type'], // derived from Is Combination
	[/^equipment\./, 'strict_container_content'], // not stored
];
const knownNotStored = (name, line) => KNOWN_NOT_STORED.some(([re, key]) => re.test(name) && line.includes(`→${key}`));

// ── W1: creates without dependencies ─────────────────────────────────────────
const d1 = '2027-03-01T09:00:00';
const d2 = '2027-03-01T17:00:00';
const w1cases = [
	{ name: 'contact.create.min', params: { resource: 'contact', operation: 'create', name: `${T} contact min` }, track: ['contacts', true] },
	{ name: 'contact.create.full', track: ['contacts', true], params: { resource: 'contact', operation: 'create', name: `${T} contact full`, additionalFields: {
		accounting_code: 'E2E-ACC', mailing_city: 'Berlin', visit_city: 'Hamburg', code: 'E2E-C1', mailing_country: 'de', visit_country: 'nl', email_1: 'e2e@example.com',
		phone_1: '+49 30 111', phone_2: '+49 30 222', mailing_postalcode: '10115', visit_postalcode: '20095', projectnote: 'e2e note',
		mailing_street: 'Teststr.', visit_street: 'Hafenweg', type: 'company', VAT_code: 'DE123456789', website: 'https://example.com',
		bank_account: 'DE02120300000000202051', bic: 'BYLADEM1001', commerce_code: 'HRB 1', contact_warning: 'e2e warning', custom: '{}',
		discount_crew: 0.01, discount_rental: 0.02, discount_sale: 0.03, discount_subrent: 0.04, discount_total: 0.05, discount_transport: 0.06, distance: 12,
		email_2: 'e2e2@example.com', ext_name_line: 'e2e ext', fiscal_code: 'FC1', folder: ref.folderContact, gender: 'male', invoice_city: 'München', invoice_country: 'at',
		invoice_district: 'Mitte', invoice_extra_address_line: 'Hinterhaus', invoice_number: '5', invoice_postalcode: '80331', invoice_state: 'BY', invoice_street: 'Marienplatz',
		invoice_unit_number: 'A', latitude: 52.5, longitude: 13.4, mailing_district: 'Mitte', mailing_extra_address_line: 'Aufgang B', mailing_number: '1', mailing_state: 'BE',
		mailing_unit_number: '2', projectnote_title: 'e2e title', purchase_number: 'PO-1', travel_time: 15, vendor_accounting_code: 'V-1', visit_district: 'Altona',
		visit_extra_address_line: 'Tor 3', visit_number: '7', visit_state: 'HH', visit_unit_number: '3' } } },
	{ name: 'appointment.create.min', track: ['appointments', true], params: { resource: 'appointment', operation: 'create', start: d1, end: d2 } },
	{ name: 'appointment.create.full', track: ['appointments', true], params: { resource: 'appointment', operation: 'create', start: d1, end: d2, additionalFields: { color: '#FF0000', is_plannable: true, is_public: true, location: 'Köln', name: `${T} appointment`, remark: 'e2e' } } },
	{ name: 'crewAvailability.create.full', track: ['crewavailability', true], params: { resource: 'crewAvailability', operation: 'create', crewmember: ref.crew, start: d1, end: d2, additionalFields: {
		recurrence_enddate: '2027-03-01T00:00:00', recurrence_interval: 1, recurrence_interval_unit: 'once', recurrence_weekdays: '[]', recurrent_group: 0, remark: T, status: 'N' } } },
	{ name: 'crewAvailability.create[id only]', track: ['crewavailability', true], params: { resource: 'crewAvailability', operation: 'create', crewmember: ref.crew.split('/')[2], start: '2027-04-01T09:00:00', end: '2027-04-01T17:00:00' } },
	{ name: 'equipment.create.full', track: ['equipment', false], params: { resource: 'equipment', operation: 'create', additionalFields: {
		code: 'E2E-EQ', critical_stock_level: 1, external_remark: 'e2e ext', factor_group: ref.factorgroup, folder: ref.folderEq, in_planner: true, in_shop: false,
		internal_remark: 'e2e int', is_combination: false, is_physical: 'Physical equipment', ledger: ref.ledger, list_price: 10, name: `${T} equipment`, price: 5,
		rental_sales: 'Rental', stock_management: 'Track stock', strict_container_content: 'Unrestricted', taxclass: ref.taxclass, type: 'item', unit: 'Stk',
		can_edit_content_during_planning: false, country_of_origin: 'de', current: 1.5, custom: '{"custom_1": "n8n-e2e custom"}', defaultgroup: 'e2e group', empty_weight: 1, height: 0.5,
		in_archive: false, ledger_debit: ref.ledgerDebit, length: 0.6, packed_per: 2, power: 100, shop_description_long: 'e2e long', shop_description_short: 'e2e short', shop_featured: true,
		shop_seo_description: 'e2e seo desc', shop_seo_keyword: 'e2e', shop_seo_title: 'e2e seo', subrental_costs: 3, surface_article: false, temporary: false, volume: 0.2, weight: 2, width: 0.4 } } },
	{ name: 'folder.create.full', track: ['folders', false], params: { resource: 'folder', operation: 'create', additionalFields: { itemtype: 'equipment', name: `${T} folder`, order: '99', parent: ref.folderEq } } },
	{ name: 'leaveMutation.create.full', track: ['leavemutation', false], params: { resource: 'leaveMutation', operation: 'create', crewmember: ref.inactiveCrew, leavetype: ref.leavetype, duration: 1, mutation_date: '2027-03-01T00:00:00', additionalFields: { remark: T } } },
	{ name: 'leaveRequest.create.full', track: ['leaverequest', false], params: { resource: 'leaveRequest', operation: 'create', requested_for: ref.crew, approval_status: 'pending', additionalFields: { description: T, reviewed_on: '2027-02-01T09:00:00', reviewer: ref.crew } } },
	{ name: 'leaveRequest.create[to reject]', track: ['leaverequest', false], params: { resource: 'leaveRequest', operation: 'create', requested_for: ref.crew, approval_status: 'pending', additionalFields: { description: `${T} to reject` } } },
	{ name: 'project.create.full', track: ['projects', false], params: { resource: 'project', operation: 'create', name: `${T} project`, additionalFields: { custom: '{}', reference: 'E2E-REF', number: String(90000 + (Date.now() % 10000)) } } },
	{ name: 'projectRequest.create.min', track: ['projectrequests', true], params: { resource: 'projectRequest', operation: 'create', name: `${T} request min`, additionalFields: { planperiod_start: d1, planperiod_end: d2 } } },
	{ name: 'projectRequest.create.full', track: ['projectrequests', true], params: { resource: 'projectRequest', operation: 'create', name: `${T} request full`, additionalFields: { planperiod_start: d1, planperiod_end: d2, customer: ref.contact, remark: 'e2e',
		contact_mailing_city: 'Berlin', contact_mailing_country: 'de', contact_mailing_number: '1', contact_mailing_postalcode: '10115', contact_mailing_street: 'Teststr.', contact_name: `${T} req contact`,
		contact_person_email: 'req@example.com', contact_person_first_name: 'Max', contact_person_lastname: 'Muster', contact_person_middle_name: 'van', contact_phone: '+49 30 1',
		external_reference: 4711, in: '2027-03-01T18:00:00', is_paid: false, language: 'de', location_mailing_city: 'Hamburg', location_mailing_country: 'de', location_mailing_number: '2',
		location_mailing_postalcode: '20095', location_mailing_street: 'Hafenweg', location_name: `${T} location`, location_phone: '+49 40 1', out: '2027-03-01T08:00:00', price: 99.5,
		usageperiod_end: '2027-03-01T16:00:00', usageperiod_start: '2027-03-01T10:00:00' } } },
	{ name: 'task.create.full', track: ['tasks', true], params: { resource: 'task', operation: 'create', color: '#00AA00', additionalFields: {
		assignment_type: 'all_crewmembers', deadline: '2027-03-02T12:00:00', deadline_type: 'specific_date', deadline_relative_offset_amount: 1, deadline_relative_offset_base: 'start_of_period',
		deadline_relative_offset_direction: 'before', deadline_relative_offset_unit: 'days', details: 'e2e details', expiry_notification_date: '2027-03-01T12:00:00', is_template: false,
		name: `${T} task`, order: '1', priority: 'low_priority', recurperiode: 1, recurhoe: 'once', synchronization_id: 'e2e-sync', synchronization_uri: 'https://example.com/e2e', time_budget: 3600, custom: '{}' } } },
	{ name: 'taskStatus.create.full', track: ['taskstatuses', true], params: { resource: 'taskStatus', operation: 'create', color: '#00AA00', additionalFields: { name: `${T} status`, order: '99', type: 'custom' } } },
	{ name: 'timeRegistration.create.full', track: ['timeregistration', true], params: { resource: 'timeRegistration', operation: 'create', crewmember: ref.crew, start: d1, end: d2, additionalFields: { break_duration: 0, custom: '{}', distance: 0, is_lunch_included: true, leavetype: ref.leavetypeWork, remark: T, travel_time: 120 } } },
	{ name: 'timeRegistration.create[correction]', track: ['timeregistration', true], params: { resource: 'timeRegistration', operation: 'create', crewmember: ref.crew, start: '2027-03-03T09:00:00', end: '2027-03-03T09:00:00', additionalFields: { correction_duration: 600, leavetype: ref.leavetypeCorrection, remark: `${T} correction` } } },
	{ name: 'vehicle.create.min', track: ['vehicles', true], params: { resource: 'vehicle', operation: 'create', additionalFields: { cost_rate: ref.rateCost } } },
	{ name: 'vehicle.create.full', track: ['vehicles', true], params: { resource: 'vehicle', operation: 'create', additionalFields: { cost_rate: ref.rateCost, custom: '{}',
		folder: ref.folderVeh, height: 2, in_planner: true, inspection_date: '2027-03-01T00:00:00', length: 5, licenseplate: 'E2E-1', multiple: 'plannable_once', name: `${T} vehicle`,
		payload_capacity: 100, remark: 'e2e', seats: 2, surface_area: '10', width: 2 } } },
	{ name: 'vehicle.createForStockLocation', track: ['vehicles', true], params: { resource: 'vehicle', operation: 'createForStockLocation', stockLocationId: ref.stockLocationId, additionalFields: { cost_rate: ref.rateCost, name: `${T} vehicle sl` } } },
];
const w1 = run(w1cases);

// Creates are read back like updates: every field that was sent must be stored.
const readBackCreates = (cases) => { for (const c of cases) if (c.track && c.result?.ok) readBack(c.name, c.track[0], c.result.first.id, c.params); };
readBackCreates(w1cases);

const C1 = idOf(w1['contact.create.full']);
const A1 = idOf(w1['appointment.create.full']);
const E1 = idOf(w1['equipment.create.full']);
const T1 = idOf(w1['task.create.full']);
const PR1 = idOf(w1['projectRequest.create.full']) || idOf(w1['projectRequest.create.min']);
const P1 = idOf(w1['project.create.full']);

const P1sub = P1 && api('GET', `/projects/${P1}/subprojects?limit=1`).json.data?.[0]?.id;
const LR1 = idOf(w1['leaveRequest.create.full']);
const LR2 = idOf(w1['leaveRequest.create[to reject]']);

// ── W1b: creates that Rentman only offers under a parent record ───────────────
const w1bCases = [
	{ name: 'contactPerson.create.full', track: ['contactpersons', true], params: { resource: 'contactPerson', operation: 'create', contactId: C1, additionalFields: {
		city: 'Berlin', country: 'de', custom: '{}', email: 'cp@example.com', firstname: 'n8n-e2e', function: 'Tester', middle_name: 'van', mobile: '+49 170 1', number: '1a',
		phone: '+49 30 3', postalcode: '10115', state: 'BE', street: 'Teststr.', surname: 'TEST' } } },
	{ name: 'appointmentCrew.create', track: ['appointmentcrew', true], params: { resource: 'appointmentCrew', operation: 'create', appointmentId: A1, crew: ref.crew } },
	{ name: 'projectRequestEquipment.create.full', track: ['projectrequestequipment', true], params: { resource: 'projectRequestEquipment', operation: 'create', projectRequestId: PR1, additionalFields: {
		discount: 0.1, factor: '1', is_comment: false, is_kit: false, linked_equipment: ref.eqA, name: T, order: '1', quantity: 1, quantity_total: 1, remark: 'e2e', unit_price: 5 } } },
	{ name: 'cost.create.full', track: ['costs', true], params: { resource: 'cost', operation: 'create', projectId: P1, subproject: P1sub ? `/subprojects/${P1sub}` : undefined, additionalFields: {
		custom: '{}', discount: 0.1, is_template: false, ledger: ref.ledger, ledger_debit: ref.ledgerDebit, name: T, purchase_price: 2, quantity: 1, remark: 'e2e', sale_price: 3, taxclass: ref.taxclass } } },
	{ name: 'stockMovement.create.full', track: ['stockmovements', true], params: { resource: 'stockMovement', operation: 'create', equipmentId: E1, date: '2027-03-01T00:00:00', additionalFields: {
		details: 'e2e', quantity: 1, remark: T, stock_location: `/stocklocations/${ref.stockLocationId}` } } },
	{ name: 'payment.create.full', track: ['payments', false], params: { resource: 'payment', operation: 'create', invoiceId: String(ref.invoiceId), moment: '2027-03-01T00:00:00', additionalFields: {
		amount: 0, payment_import_source: 'quickbooks', remark: T } } },
	{ name: 'subproject.create.full', track: ['subprojects', false], params: { resource: 'subproject', operation: 'create', projectId: P1, additionalFields: { custom: '{}', name: `${T} subproject` } } },
	{ name: 'projectFunctionGroup.create.full', track: ['projectfunctiongroups', false], params: { resource: 'projectFunctionGroup', operation: 'create', projectId: P1, subprojectPath: P1sub ? `/subprojects/${P1sub}` : undefined, additionalFields: {
		name: `${T} function group`, planperiod_end: d2, planperiod_start: d1, remark: 'e2e', usageperiod_end: '2027-03-01T16:00:00', usageperiod_start: '2027-03-01T10:00:00' } } },
	// Rentman refuses to change or delete these hours once the request was approved (also after canceling), so they stay for manual removal.
	{ name: 'timeRegistration.createForLeaveRequest', track: ['timeregistration', false], params: { resource: 'timeRegistration', operation: 'createForLeaveRequest', leaveRequestId: LR1, crewmember: ref.crew,
		start: '2027-05-03T00:00:00', end: '2027-05-04T00:00:00', additionalFields: { duration: 28800, leavetype: ref.leavetype, remark: T } } },
	{ name: 'timeRegistration.createForLeaveRequest[to reject]', track: ['timeregistration', true], params: { resource: 'timeRegistration', operation: 'createForLeaveRequest', leaveRequestId: LR2, crewmember: ref.crew,
		start: '2027-05-10T00:00:00', end: '2027-05-11T00:00:00', additionalFields: { duration: 28800, leavetype: ref.leavetype } } },
];
const runnableNow = (cases) => cases.filter((c) => {
	const missing = Object.entries(c.params).some(([k, v]) => v === undefined);
	if (missing) { results.push({ name: c.name, ok: null, error: 'prerequisite record could not be created' }); console.log(`SKIP ${c.name}: prerequisite record missing`); }
	return !missing;
});
const w1b = run(runnableNow(w1bCases));
const CP1 = idOf(w1b['contactPerson.create.full']);
const AC1 = idOf(w1b['appointmentCrew.create']);
const PRE1 = idOf(w1b['projectRequestEquipment.create.full']);
const CO1 = idOf(w1b['cost.create.full']);
const SM1 = idOf(w1b['stockMovement.create.full']);
const PAY1 = idOf(w1b['payment.create.full']);
const PFG1 = idOf(w1b['projectFunctionGroup.create.full']);
const LRH1 = idOf(w1b['timeRegistration.createForLeaveRequest']);
const LRH2 = idOf(w1b['timeRegistration.createForLeaveRequest[to reject]']);
const w1cCases = runnableNow([
	{ name: 'projectFunction.create.full', track: ['projectfunctions', false], params: { resource: 'projectFunction', operation: 'create', projectId: P1, subprojectPath: P1sub ? `/subprojects/${P1sub}` : undefined,
		costRate: ref.rateCost, priceRate: ref.ratePrice, additionalFields: {
		amount: 1, cost_accommodation: 1, cost_catering: 2, cost_other: 3, cost_travel: 4, custom: '{}', group: PFG1 ? `/projectfunctiongroups/${PFG1}` : undefined, is_plannable: true,
		name: `${T} function`, name_external: `${T} function ext`, planperiod_end: d2, planperiod_start: d1, price_accommodation: 5, price_catering: 6, price_other: 7, price_travel: 8,
		type: 'crew_function', usageperiod_end: '2027-03-01T16:00:00', usageperiod_start: '2027-03-01T10:00:00' } } },
]);
run(w1cCases);
readBackCreates(w1bCases);
readBackCreates(w1cCases);

// ── W2: creates that hang off W1 records ─────────────────────────────────────
const parents = ['contacts', 'contactpersons', 'contracts', 'crew', 'equipment', 'invoices', 'projects', 'purchaseorders', 'quotes', 'repairs', 'serialnumbers', 'subrentals', 'suppliers', 'vehicles'];
const parentIds = { contacts: C1, contactpersons: CP1, crew: ref.crew.split('/')[2], equipment: E1, projects: P1 };
for (const p of parents) if (!parentIds[p]) parentIds[p] = firstId(`/${p}`);
const w2cases = [
	{ name: 'accessory.create.full', track: ['accessories', true], params: { resource: 'accessory', operation: 'create', equipmentId: E1, additionalFields: { add_as_new_line: false, automatic: true, equipment: ref.eqA, is_free: false, order: '1', quantity: 1, skip: false } } },
	{ name: 'alternative.create', track: ['alternatives', true], params: { resource: 'alternative', operation: 'create', equipmentId: E1, alternative: ref.eqA } },
	{ name: 'equipmentSetsContent.create.full', track: ['equipmentsetscontent', true], params: { resource: 'equipmentSetsContent', operation: 'create', equipmentId: E1, additionalFields: { equipment: ref.eqA, is_fixed: 'Reserved from stock', is_physically_connected: 'Will remain in the combination when emptying combinations', order: '1', quantity: '1' } } },
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
const TS1 = idOf(w1['taskStatus.create.full']);
const TR1 = idOf(w1['timeRegistration.create.full']);
const TRC = idOf(w1['timeRegistration.create[correction]']);
const V1 = idOf(w1['vehicle.create.full']);

// ── W3: updates, then read back and compare every field that was sent ───────
const d3 = '2027-03-02T10:00:00';
const d4 = '2027-03-02T18:00:00';
const u = (name, resource, idParam, id, coll, params) => ({ name, coll, id, params: { resource, operation: 'update', [idParam]: id, ...params } });
const w3cases = [
	u('accessory.update', 'accessory', 'accessoryId', ACC, 'accessories', { updateFields: { add_as_new_line: true, automatic: false, equipment: ref.eqB, is_free: true, order: '2', quantity: 2, skip: true } }),
	u('alternative.update', 'alternative', 'alternativeId', ALT, 'alternatives', { alternative: ref.eqB }),
	u('appointment.update', 'appointment', 'appointmentId', A1, 'appointments', { start: d3, end: d4, updateFields: { color: '#00AA00', is_plannable: false, is_public: false, location: 'Bonn', name: `${T} appointment upd`, remark: 'e2e upd' } }),
	u('appointmentCrew.update', 'appointmentCrew', 'appointmentCrewId', AC1, 'appointmentcrew', { updateFields: { crew: ref.crew } }),
	u('contact.update', 'contact', 'contactId', C1, 'contacts', { updateFields: {
		accounting_code: 'E2E-ACC2', mailing_city: 'Köln', visit_city: 'Bonn', code: 'E2E-C2', email_1: 'e2e2@example.com', name: `${T} contact upd`,
		phone_1: '+49 221 1', phone_2: '+49 221 2', projectnote: 'e2e note 2', mailing_street: 'Domplatz', type: 'company', VAT_code: 'DE987654321', website: 'https://example.org',
		admin_contactperson: CP1 ? `/contactpersons/${CP1}` : undefined, bank_account: 'DE89370400440532013000', bic: 'COBADEFFXXX', commerce_code: 'HRB 2', contact_warning: 'e2e warning 2',
		visit_country: 'be', custom: '{}', default_person: CP1 ? `/contactpersons/${CP1}` : undefined, discount_crew: 0.11, discount_rental: 0.12, discount_sale: 0.13, discount_subrent: 0.14,
		discount_total: 0.15, discount_transport: 0.16, distance: 13, email_2: 'e2e3@example.com', ext_name_line: 'e2e ext 2', fiscal_code: 'FC2', gender: 'female',
		invoice_city: 'Wien', invoice_country: 'ch', invoice_district: 'Innere Stadt', invoice_extra_address_line: 'Stiege 2', invoice_number: '6', invoice_postalcode: '1010',
		invoice_state: 'W', invoice_street: 'Graben', invoice_unit_number: 'B', latitude: 50.9, longitude: 6.9, mailing_country: 'fr', mailing_district: 'Altstadt',
		mailing_extra_address_line: 'Aufgang C', mailing_number: '2', mailing_postalcode: '50667', mailing_state: 'NW', mailing_unit_number: '3', projectnote_title: 'e2e title 2',
		purchase_number: 'PO-2', travel_time: 16, vendor_accounting_code: 'V-2', visit_district: 'Beuel', visit_extra_address_line: 'Tor 4', visit_number: '8',
		visit_postalcode: '53111', visit_state: 'NW', visit_street: 'Rheinweg', visit_unit_number: '4' } }),
	u('contact.update[type=private]', 'contact', 'contactId', C1, 'contacts', { updateFields: { firstname: 'Erika', surfix: 'de', surname: 'Privat', type: 'private' } }),
	u('contactPerson.update', 'contactPerson', 'contactPersonId', CP1, 'contactpersons', { updateFields: { city: 'Berlin', country: 'de', email: 'cp@example.com', firstname: 'n8n-e2e upd', function: 'Tester', number: '1a', surname: 'TEST upd', middle_name: 'van', mobile: '+49 170 1', phone: '+49 30 3', postalcode: '10115', state: 'BE', street: 'Teststr.', custom: '{}' } }),
	u('cost.update', 'cost', 'costId', CO1, 'costs', { subproject: P1sub ? `/subprojects/${P1sub}` : '', updateFields: { custom: '{}', discount: 0.2, is_template: false, ledger: ref.ledger, ledger_debit: ref.ledgerDebit, name: `${T} cost upd`, purchase_price: 4, quantity: 2, remark: 'e2e upd', sale_price: 6, taxclass: ref.taxclass } }),
	u('crewAvailability.update', 'crewAvailability', 'crewAvailabilityId', CA1, 'crewavailability', { updateFields: { start: d3, end: d4, recurrence_enddate: '2027-03-02T00:00:00', recurrence_interval: 1, recurrence_interval_unit: 'once', recurrence_weekdays: '[]', recurrent_group: 0, remark: `${T} upd`, status: 'B' } }),
	u('equipment.update', 'equipment', 'equipmentId', E1, 'equipment', { additionalFields: {
		code: 'E2E-EQ2', critical_stock_level: 2, external_remark: 'e2e ext 2', in_planner: false, in_shop: true, internal_remark: 'e2e int 2', list_price: 11, name: `${T} equipment upd`, price: 6,
		rental_sales: 'Sale', unit: 'Pcs', can_edit_content_during_planning: false, country_of_origin: 'nl', current: 2.5, custom: '{"custom_1": "n8n-e2e custom 2"}', defaultgroup: 'e2e group 2',
		empty_weight: 2, height: 0.7, in_archive: false, ledger_debit: ref.ledgerDebit, length: 0.8, packed_per: 3, power: 200, shop_description_long: 'e2e long 2', shop_description_short: 'e2e short 2',
		shop_featured: false, shop_seo_description: 'e2e seo desc 2', shop_seo_keyword: 'e2e2', shop_seo_title: 'e2e seo 2', subrental_costs: 4, surface_article: true, temporary: false, volume: 0.3,
		weight: 3, width: 0.5 } }),
	u('equipmentSetsContent.update', 'equipmentSetsContent', 'equipmentSetsContentId', ESC, 'equipmentsetscontent', { updateFields: { equipment: ref.eqB, is_fixed: 'Available outside this combination', is_physically_connected: 'Will be removed when emptying combinations', order: '2', quantity: '2' } }),
	u('folder.update', 'folder', 'folderId', F1, 'folders', { additionalFields: { itemtype: 'equipment', name: `${T} folder upd`, order: '98', parent: ref.folderEq } }),
	u('leaveRequest.update', 'leaveRequest', 'leaveRequestId', LR1, 'leaverequest', { requested_for: ref.crew, updateFields: { description: `${T} upd`, reviewed_on: '2027-02-02T09:00:00', reviewer: ref.crew } }),
	u('leaveRequest.update[approved]', 'leaveRequest', 'leaveRequestId', LRH1 && LR1, 'leaverequest', { requested_for: ref.crew, updateFields: { approval_status: 'approved' } }),
	// Rentman refuses some status changes (approved → rejected, anything out of canceled), so rejecting uses a second request.
	u('leaveRequest.update[rejected]', 'leaveRequest', 'leaveRequestId', LRH2 && LR2, 'leaverequest', { requested_for: ref.crew, updateFields: { approval_status: 'rejected' } }),
	u('leaveRequest.update[canceled]', 'leaveRequest', 'leaveRequestId', LR1, 'leaverequest', { requested_for: ref.crew, updateFields: { approval_status: 'canceled' } }),
	u('payment.update', 'payment', 'paymentId', PAY1, 'payments', { updateFields: { date: '2027-03-02T00:00:00', amount: 0, remark: `${T} upd`, payment_import_source: 'xero' } }),
	u('projectRequest.update', 'projectRequest', 'projectRequestId', PR1, 'projectrequests', { planperiod_start: d3, planperiod_end: d4, updateFields: { name: `${T} request upd`, remark: 'e2e upd',
		contact_mailing_city: 'Köln', contact_mailing_country: 'nl', contact_mailing_number: '2', contact_mailing_postalcode: '50667', contact_mailing_street: 'Domplatz', contact_name: `${T} req contact 2`,
		contact_person_email: 'req2@example.com', contact_person_first_name: 'Erika', contact_person_lastname: 'Muster', contact_person_middle_name: 'de', contact_phone: '+49 221 1', customer: ref.contact,
		external_reference: 4712, in: '2027-03-02T19:00:00', is_paid: true, language: 'en', location_mailing_city: 'Bonn', location_mailing_country: 'be', location_mailing_number: '3',
		location_mailing_postalcode: '53111', location_mailing_street: 'Rheinweg', location_name: `${T} location 2`, location_phone: '+49 228 1', out: '2027-03-02T09:00:00', price: 100.5,
		usageperiod_end: '2027-03-02T17:00:00', usageperiod_start: '2027-03-02T11:00:00' } }),
	u('projectRequestEquipment.update', 'projectRequestEquipment', 'projectRequestEquipmentId', PRE1, 'projectrequestequipment', { updateFields: { discount: 0.2, factor: '2', is_comment: false, is_kit: false, linked_equipment: ref.eqB, name: `${T} upd`, order: '2', quantity: 2, quantity_total: 2, remark: 'e2e upd', unit_price: 6 } }),
	u('serialNumber.update', 'serialNumber', 'serialNumberId', SN, 'serialnumbers', { updateFields: { active: false, book_value: 2, depreciation_monthly: 1, purchase_costs: 2, purchasedate: '2025-01-02T00:00:00', ref: 'E2E2', remark: `${T} upd`, residual_value: 1, serial: 'E2E-SN-2', custom: '{}' } }),
	u('stockMovement.update', 'stockMovement', 'stockMovementId', SM1, 'stockmovements', { updateFields: { date: '2027-03-02T00:00:00', quantity: 2, remark: `${T} upd`, details: 'e2e', stock_location: `/stocklocations/${ref.stockLocationId}` } }),
	u('subtask.update', 'subtask', 'subtaskId', ST1, 'subtasks', { updateFields: { completed: true, title: `${T} subtask upd` } }),
	u('supplier.update', 'supplier', 'supplierId', SUP, 'suppliers', { updateFields: { contact: `/contacts/${C1}`, details: 'e2e upd', price: 2 } }),
	u('task.update', 'task', 'taskId', T1, 'tasks', { additionalFields: { color: '#AA0000', name: `${T} task upd`, details: 'e2e upd', priority: 'high_priority', completed_by: ref.crew, completed_at: '2027-03-02T12:00:00', custom: '{}' } }),
	u('taskAssignment.update', 'taskAssignment', 'taskAssignmentId', TA1, 'taskassignments', { updateFields: { crew: ref.crew } }),
	u('taskStatus.update', 'taskStatus', 'taskStatusId', TS1, 'taskstatuses', { additionalFields: { color: '#AA0000', name: `${T} status upd`, order: '98', type: 'custom' } }),
	u('timeRegistration.update', 'timeRegistration', 'timeRegId', TR1, 'timeregistration', { updateFields: { break_duration: 1800, crewmember: ref.crew, custom: '{}', distance: 1, end: d4, is_lunch_included: false, leavetype: ref.leavetypeWork, remark: `${T} upd`, start: d3, travel_time: 240 } }),
	u('timeRegistration.update[correction]', 'timeRegistration', 'timeRegId', TRC, 'timeregistration', { updateFields: { correction_duration: 900, remark: `${T} correction upd` } }),
	u('vehicle.update', 'vehicle', 'vehicleId', V1, 'vehicles', { updateFields: { height: 3, in_planner: false, length: 6, licenseplate: 'E2E-2', multiple: 'plannable_multi', name: `${T} vehicle upd`, payload_capacity: 200, remark: 'e2e upd', seats: 3, surface_area: '12', width: 3, cost_rate: ref.rateCost, custom: '{}' } }),
	u('equipment.update[type=case]', 'equipment', 'equipmentId', E1, 'equipment', { additionalFields: { type: 'case' } }),
	u('equipment.update[type=set]', 'equipment', 'equipmentId', E1, 'equipment', { additionalFields: { type: 'set' } }),
	u('equipment.update[is_physical,is_combination,strict]', 'equipment', 'equipmentId', E1, 'equipment', { additionalFields: { is_physical: 'Virtual package', is_combination: true, strict_container_content: 'Strict' } }),
	u('equipment.update[can_edit_content_during_planning]', 'equipment', 'equipmentId', E1, 'equipment', { additionalFields: { can_edit_content_during_planning: true } }),
	u('equipment.update[type=item]', 'equipment', 'equipmentId', E1, 'equipment', { additionalFields: { type: 'item' } }),
	u('equipment.update[stock_management]', 'equipment', 'equipmentId', E1, 'equipment', { additionalFields: { stock_management: 'Exclude from stock tracking' } }),
	// Rentman hides temporary equipment from every read, so only the switch back is read back.
	{ ...u('equipment.update[temporary]', 'equipment', 'equipmentId', E1, 'equipment', { additionalFields: { temporary: true } }), noReadBack: true },
	u('equipment.update[temporary=false]', 'equipment', 'equipmentId', E1, 'equipment', { additionalFields: { temporary: false } }),
];
const runnable = w3cases.filter((c) => {
	if (c.id) return true;
	results.push({ name: c.name, ok: null, error: 'prerequisite record could not be created' });
	console.log(`SKIP ${c.name}: prerequisite record missing`);
	return false;
});
// Each update runs alone so that sequential updates of the same record read back cleanly.
const w3 = {};
for (const c of runnable) {
	Object.assign(w3, run([c]));
	// Read back straight away: a later update (e.g. equipment stock tracking) can remove the record.
	if (w3[c.name].ok && !c.noReadBack) readBack(c.name, c.coll, c.id, c.params);
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
	del('timeRegistration.delete#correction', 'timeRegistration', 'timeRegId', TRC),
	del('timeRegistration.delete#rejectedLeave', 'timeRegistration', 'timeRegId', LRH2),
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

for (const [name, lines] of Object.entries(ignored)) {
	const unexpected = lines.filter((l) => !knownNotStored(name, l));
	const r = results.find((x) => x.name === name);
	if (unexpected.length && r?.ok) { r.ok = false; r.error = `read-back: ${unexpected.join('; ')}`; console.log(`FAIL ${name}: ${r.error}`); }
}
fs.writeFileSync(path.join(outDir, 'writes.json'), JSON.stringify({ results, ignored, ref }, null, 1));
console.log('\nFields sent but not stored (known Rentman behavior unless the case failed):');
for (const [k, v] of Object.entries(ignored)) console.log(`  ${k}: ${v.join('; ')}`);
console.log('\nLeft in the account:');
for (const l of ledger.filter((x) => !x.deleted)) console.log(`  /${l.kind}/${l.id}${l.deletable ? ' (deletable, cleanup failed)' : ' (no API delete)'}`);
const bad = results.filter((r) => r.ok === false);
console.log(`\nwrites: ${results.length} runs, ${results.filter((r) => r.ok).length} ok, ${bad.length} failed, ${results.filter((r) => r.ok === null).length} not runnable`);
