// Unit tests for the request hooks every Rentman operation relies on. Run with `npm test` (builds first).
const test = require('node:test');
const assert = require('node:assert/strict');
const { withUtcOffset, withWriteHooks, rentmanPagination } = require('../../dist/nodes/Rentman/descriptions/shared.js');

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
