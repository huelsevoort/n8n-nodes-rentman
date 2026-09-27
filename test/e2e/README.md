# End-to-end test against a mocked Rentman API

Runs every resource/operation of the node inside a real n8n instance, twice per operation:

- **min**: only required parameters.
- **full**: every optional field, filter, Expand and Custom Query Parameters (including a blank row) filled in.

`mock.js` impersonates `api.rentman.net` over HTTPS and echoes each request back. `analyze.js` then checks, per operation, the HTTP method, the URL (IDs substituted, no `undefined`/`{{`), the auth header, and that every filled field arrived under the right query/body key. `issues.js` runs n8n's own parameter validator (the check behind "The workflow has issues") on every parameter set.

## Setup

```bash
npm install n8n                     # in a scratch directory; n8n 2.x needs Node.js >= 24
cp env.example.sh env.sh            # and fill in the paths
openssl req -x509 -newkey rsa:2048 -nodes -keyout key.pem -out cert.pem -days 7 \
  -subj "/CN=api.rentman.net" -addext "subjectAltName=DNS:api.rentman.net"
echo "127.0.0.1 api.rentman.net" | sudo tee -a /etc/hosts
sudo node mock.js requests.jsonl &  # listens on 127.0.0.1:443
./run-all.sh
```

`pagination-wf.json` is a separate workflow that checks **Return All** follows `next_page_url` across three pages.

Remove the `/etc/hosts` line afterwards, otherwise n8n on this machine keeps talking to the mock.
