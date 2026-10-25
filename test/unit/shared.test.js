// Unit tests for the request hooks every Rentman operation relies on. Run with `npm test` (builds first).
const test = require('node:test');
const assert = require('node:assert/strict');
const { withUtcOffset, toLocalDate, withWriteHooks, rentmanPagination } = require('../../dist/nodes/Rentman/descriptions/shared.js');

test('withUtcOffset adds the offset of the timezone at that wall-clock time', () => {
	assert.equal(withUtcOffset('2027-01-15T09:00:00', 'Europe/Berlin'), '2027-01-15T09:00:00+01:00');
	assert.equal(withUtcOffset('2027-07-15T09:00:00', 'Europe/Berlin'), '2027-07-15T09:00:00+02:00');
	assert.equal(withUtcOffset('2027-07-15T09:00:00', 'America/New_York'), '2027-07-15T09:00:00-04:00');
	assert.equal(withUtcOffset('2027-01-15T09:00:00', 'UTC'), '2027-01-15T09:00:00+00:00');
});

test('withUtcOffset handles the hours around a DST switch', () => {
	// Europe/Berlin switches to summer time on 2027-03-28 at 02:00 local time.
	assert.equal(withUtcOffset('2027-03-28T01:30:00', 'Europe/Berlin'), '2027-03-28T01:30:00+01:00');
	assert.equal(withUtcOffset('2027-03-28T03:30:00', 'Europe/Berlin'), '2027-03-28T03:30:00+02:00');
});

test('withUtcOffset leaves values that already carry an offset unchanged', () => {
	assert.equal(withUtcOffset('2027-01-15T09:00:00+05:00', 'Europe/Berlin'), '2027-01-15T09:00:00+05:00');
	assert.equal(withUtcOffset('2027-01-15T09:00:00Z', 'Europe/Berlin'), '2027-01-15T09:00:00Z');
});

test('toLocalDate sends the date as written', () => {
	assert.equal(toLocalDate('2027-03-01', 'Europe/Berlin'), '2027-03-01');
	assert.equal(toLocalDate('2027-03-01T00:00:00', 'Europe/Berlin'), '2027-03-01');
	assert.equal(toLocalDate('2027-03-01T23:30:00', 'Europe/Berlin'), '2027-03-01');
	// A value with its own offset keeps its own date, whatever the workflow timezone.
	assert.equal(toLocalDate('2027-03-01T00:00:00.000Z', 'America/New_York'), '2027-03-01');
	assert.equal(toLocalDate('2027-03-01T00:30:00+01:00', 'America/New_York'), '2027-03-01');
	assert.equal(toLocalDate('2027-02-28T23:30:00.000Z', 'Europe/Berlin'), '2027-02-28');
	assert.equal(toLocalDate('not a date', 'Europe/Berlin'), 'not a date');
});

test('toLocalDate reads other date strings in the workflow timezone', () => {
	// 23:30 UTC on 28 Feb is already 1 March in Berlin.
	assert.equal(toLocalDate('Sun, 28 Feb 2027 23:30:00 GMT', 'Europe/Berlin'), '2027-03-01');
	assert.equal(toLocalDate('Sun, 28 Feb 2027 23:30:00 GMT', 'America/New_York'), '2027-02-28');
});

// Runs the write hook withWriteHooks adds to a POST operation.
function writeHook() {
	const props = [{ name: 'operation', type: 'options', options: [{ value: 'create', routing: { request: { method: 'POST' } } }] }];
	withWriteHooks(props);
	return { props, hook: props[0].options[0].routing.send.preSend.at(-1) };
}
const ctx = (resource, operation) => ({
	getTimezone: () => 'Europe/Berlin',
	getNodeParameter: (name) => ({ resource, operation })[name],
	getNode: () => ({ name: 'Rentman', type: 'n8n-nodes-rentman.rentman', typeVersion: 1, parameters: {} }),
});

test('a write without any field sends an empty JSON object', async () => {
	const { hook } = writeHook();
	assert.equal((await hook.call(ctx('contact', 'create'), { body: undefined })).body, '{}');
	assert.equal((await hook.call(ctx('contact', 'create'), { body: {} })).body, '{}');
});

test('zone-less dates in the body get the workflow timezone offset', async () => {
	const { hook } = writeHook();
	const out = await hook.call(ctx('appointment', 'create'), { body: { start: '2027-01-15T09:00:00', name: '2027-01-15T09:00:00' } });
	assert.equal(out.body.start, '2027-01-15T09:00:00+01:00');
	assert.equal(out.body.name, '2027-01-15T09:00:00', 'only date keys are touched');
});

test('plain-date keys are sent as the date alone', async () => {
	const { hook } = writeHook();
	const out = await hook.call(ctx('project', 'createFromTemplate'), { body: { template: 13, start_date: '2027-03-01T00:00:00' } });
	assert.deepEqual(out.body, { template: 13, start_date: '2027-03-01' });
});

test('start_date is a plain date only where Rentman reads it as one', async () => {
	const { hook } = writeHook();
	const out = await hook.call(ctx('contact', 'update'), { body: { start_date: '2027-03-01T10:00:00' } });
	assert.equal(out.body.start_date, '2027-03-01T10:00:00');
});

test('project request create without plan period stops with a clear error', async () => {
	const { hook } = writeHook();
	await assert.rejects(hook.call(ctx('projectRequest', 'create'), { body: { name: 'x' } }), /Rentman requires Additional Fields → Plan Period Start/);
	await assert.rejects(hook.call(ctx('projectRequest', 'create'), { body: { planperiod_start: '2027-03-01T10:00:00' } }), /Plan Period End/);
	await assert.doesNotReject(hook.call(ctx('projectRequest', 'create'), { body: { planperiod_start: '2027-03-01T10:00:00', planperiod_end: '2027-03-02T10:00:00' } }));
});

test('vehicle create without cost rate stops with a clear error', async () => {
	const { hook } = writeHook();
	await assert.rejects(hook.call(ctx('vehicle', 'create'), { body: { name: 'x' } }), /Rentman requires Additional Fields → Cost Rate/);
	await assert.doesNotReject(hook.call(ctx('vehicle', 'create'), { body: { cost_rate: '/rates/1' } }));
});

test('withWriteHooks adds its hook only once', () => {
	const { props } = writeHook();
	withWriteHooks(props);
	assert.equal(props[0].options[0].routing.send.preSend.length, 1);
});

test('Return All follows next_page_url without re-sending the first query', () => {
	const p = rentmanPagination.properties;
	assert.match(p.continue, /next_page_url/);
	assert.match(p.continue, /\$parameter\["returnAll"\]/);
	assert.match(p.request.url, /\$response\.body\?\.next_page_url/);
	assert.match(p.request.qs, /next_page_url \? \{\} : \$request\.qs/);
});

test('dates from expressions (Luxon DateTime, JS Date) are converted like strings', async () => {
	const { DateTime } = require('luxon');
	const { hook } = writeHook();
	// $today.plus(...) in Berlin: midnight local is the previous day in UTC.
	const luxon = DateTime.fromISO('2027-03-01T00:30:00', { zone: 'Europe/Berlin' });
	let out = await hook.call(ctx('project', 'createFromTemplate'), { body: { template: 13, start_date: luxon } });
	assert.equal(out.body.start_date, '2027-03-01');
	// A JS Date has no zone: it is read in the workflow timezone (Berlin), where this is 1 March.
	out = await hook.call(ctx('project', 'createFromTemplate'), { body: { template: 13, start_date: new Date('2027-02-28T23:30:00Z') } });
	assert.equal(out.body.start_date, '2027-03-01');
	out = await hook.call(ctx('appointment', 'create'), { body: { start: new Date('2027-07-15T07:00:00Z') } });
	assert.equal(out.body.start, '2027-07-15T09:00:00.000+02:00');
	out = await hook.call(ctx('appointment', 'create'), { body: { start: luxon } });
	assert.equal(out.body.start, '2027-03-01T00:30:00.000+01:00');
	// What actually reaches the hook: n8n's deep merge of the body copies the DateTime into a plain object.
	const merged = JSON.parse(JSON.stringify({ ...luxon, isLuxonDateTime: true }));
	assert.equal(typeof merged.toISO, 'undefined');
	out = await hook.call(ctx('project', 'createFromTemplate'), { body: { template: 13, start_date: merged } });
	assert.equal(out.body.start_date, '2027-03-01');
	out = await hook.call(ctx('appointment', 'create'), { body: { start: { ...merged } } });
	assert.equal(out.body.start, '2027-03-01T00:30:00.000+01:00');
	const ny = JSON.parse(JSON.stringify({ ...DateTime.fromISO('2027-07-15T09:00:00', { zone: 'America/New_York' }), isLuxonDateTime: true }));
	out = await hook.call(ctx('appointment', 'create'), { body: { start: ny } });
	assert.equal(out.body.start, '2027-07-15T09:00:00.000-04:00');
});

test('create from template stops on a template that is not an ID or path', async () => {
	const { hook } = writeHook();
	for (const template of [NaN, null, 0, 1.5]) {
		await assert.rejects(hook.call(ctx('project', 'createFromTemplate'), { body: { template, start_date: '2027-03-01' } }), /Project Template must be an ID/);
	}
});

test('a Limit above 1500 stops with a clear error before Rentman answers "Bad request"', async () => {
	const props = [{ name: 'operation', type: 'options', options: [{ value: 'getAll', routing: { request: { method: 'GET' } } }, { value: 'get', routing: { request: { url: '/x' } } }] }];
	withWriteHooks(props);
	for (const option of props[0].options) {
		const hook = option.routing.send.preSend.at(-1);
		await assert.rejects(hook.call(ctx('contact', option.value), { qs: { limit: 1501 } }), /Limit must be 1500 or less/);
		await assert.doesNotReject(hook.call(ctx('contact', option.value), { qs: { limit: 1500 } }));
		await assert.doesNotReject(hook.call(ctx('contact', option.value), { qs: {} }));
	}
});

test('set client, location and type stop on an ID that is not an ID or path', async () => {
	const { hook } = writeHook();
	await assert.rejects(hook.call(ctx('project', 'setClient'), { body: { client: NaN } }), /Client must be an ID/);
	await assert.rejects(hook.call(ctx('project', 'setClient'), { body: { client: 12, contact_person: NaN } }), /Contact Person must be an ID/);
	await assert.doesNotReject(hook.call(ctx('project', 'setClient'), { body: { client: 12, copy_data: true } }));
	await assert.rejects(hook.call(ctx('project', 'setType'), { body: { type: 0 } }), /Project Type must be an ID/);
	await assert.rejects(hook.call(ctx('subproject', 'setLocation'), { body: { location: null } }), /Location must be an ID/);
	await assert.doesNotReject(hook.call(ctx('subproject', 'setLocation'), { body: { location: 12, contact_person: 7 } }));
});

test('toId takes an ID or a path of its own collection only', () => {
	// The routing expression, evaluated the way n8n does for a plain value.
	const run = (expr, value) => new Function('$value', `return ${expr.slice(4, -3)}`)(value);
	const { toId } = require('../../dist/nodes/Rentman/descriptions/shared.js');
	const client = toId('contacts');
	assert.equal(run(client, '12'), 12);
	assert.equal(run(client, ' /contacts/12 '), 12);
	assert.equal(run(client, 12), 12);
	for (const bad of ['/contactpersons/7', '1e3', '0x1F', '12abc', '', '/contacts/']) assert.ok(Number.isNaN(run(client, bad)), bad);
	assert.equal(run(toId('contactpersons', true), ''), undefined);
	assert.equal(run(toId('contactpersons', true), '/contactpersons/7'), 7);
});

test('Set operations take a record ID only as a number or a path of its own collection', async () => {
	const { idSegment } = require('../../dist/nodes/Rentman/descriptions/shared.js');
	const seg = (id) => new Function('$parameter', `return ${idSegment('projects', 'projectId').slice(3, -3)}`)({ projectId: id });
	assert.equal(seg('42'), '42');
	assert.equal(seg(' /projects/42 '), '42');
	assert.equal(seg(42), '42');
	for (const bad of ['/subprojects/42', '229x', '12.5', '2026-0042', '', undefined]) assert.equal(seg(bad), 'invalid-id', String(bad));
	const { hook } = writeHook();
	await assert.rejects(hook.call(ctx('project', 'setClient'), { url: '/projects/invalid-id/:setClient', body: { client: 12 } }), /must be a number or a path of its own collection/);
	await assert.doesNotReject(hook.call(ctx('project', 'setClient'), { url: '/projects/42/:setClient', body: { client: 12 } }));
});
