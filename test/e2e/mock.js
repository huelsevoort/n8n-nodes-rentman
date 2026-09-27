// HTTPS mock of api.rentman.net: echoes each request back in the response.
const https = require('https');
const fs = require('fs');
const path = require('path');
const log = fs.createWriteStream(process.argv[2] || 'requests.jsonl', { flags: 'a' });
https.createServer({ key: fs.readFileSync(path.join(__dirname, 'key.pem')), cert: fs.readFileSync(path.join(__dirname, 'cert.pem')) }, (req, res) => {
	let raw = '';
	req.on('data', (c) => (raw += c));
	req.on('end', () => {
		const u = new URL(req.url, 'https://api.rentman.net');
		const query = {};
		for (const [k, v] of u.searchParams) query[k] = v;
		let body = null;
		try { body = raw ? JSON.parse(raw) : null; } catch { body = { _unparsable: raw }; }
		const echo = { method: req.method, path: u.pathname, rawQuery: u.search, query, body, auth: req.headers.authorization || null };
		log.write(JSON.stringify(echo) + '\n');
		if (req.headers.authorization !== 'Bearer mock-token') { res.writeHead(401, { 'content-type': 'application/json' }); return res.end('{"message":"unauthorized"}'); }
		const segs = u.pathname.split('/').filter(Boolean);
		const isItem = /^\d+$/.test(segs[segs.length - 1] || '');
		let payload;
		if (req.method === 'DELETE') { res.writeHead(204); return res.end(); }
		if (req.method === 'GET' && !isItem && query.paginationtest !== undefined) {
			// Pagination check: three pages chained through next_page_url.
			const page = Number(query.page || 1);
			payload = { data: [{ id: page, _echo: echo }], next_page_url: page < 3 ? `https://api.rentman.net${u.pathname}?paginationtest=1&page=${page + 1}` : null };
		} else if (req.method === 'GET' && !isItem) payload = { data: [{ id: 1, _echo: echo }, { id: 2 }], itemCount: 2, limit: 2, offset: 0 };
		else payload = { data: { id: 1, _echo: echo } };
		res.writeHead(200, { 'content-type': 'application/json' });
		res.end(JSON.stringify(payload));
	});
}).listen(443, '127.0.0.1', () => console.log('mock listening'));
