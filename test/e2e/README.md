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

# Live run against the real Rentman API

`run-live.sh` runs the same node inside n8n against `api.rentman.net` itself. Use a test account if you have one.

```bash
export RENTMAN_API_TOKEN=...        # the token the node's credential gets
# env.sh as above, but without the NODE_EXTRA_CA_CERTS / NO_PROXY lines and without the /etc/hosts entry
export GENERIC_TIMEZONE=Europe/Berlin
./run-live.sh /tmp/rentman-live
```

- `live-reads.js`: every read operation. For each resource it picks a real record X, checks that Get returns X, and runs Get Collection three times: limit 1, offset 1, and with every filter, Fields, Sort, Expand and Custom Query Parameters (plus a blank row) set from X's own values, which must still return X. Every sub-collection getter and Get For Parent (all 14 parent types) runs against a real parent.
- `live-pagination.js`: Return All with small pages (Custom Query Parameter `limit`) combined with filters, Fields, Sort and Expand, compared item by item with the same list read directly.
- `live-writes.js`: every create, update and delete. Records are named `n8n-e2e TEST` and logged to `created.json`. After each update the record is read back and every sent field is compared with what Rentman stored. Everything that can be deleted is deleted at the end; `live-cleanup.js <dir>` deletes leftovers after an aborted run.

Rentman's API cannot delete projects, equipment, folders, leave mutations, leave requests or payments. Each live write run leaves one of each (named `n8n-e2e TEST`, the payment has amount 0 on the first invoice); remove them in Rentman afterwards.

Known Rentman-side results in the live run (not node bugs):
- Vehicle → Create fails with HTTP 500 ("Das Speichern der Artikel ist fehlgeschlagen") for any body, also when called directly.
- Task Status → Create needs a token user who may create task statuses (HTTP 401 otherwise).
- Leave Request → Update to Rejected fails with HTTP 500; Pending/Approved/Canceled work.
- Changing Equipment → Stock Management to "Exclude from stock tracking" deletes that item's serial numbers and stock movements.
- Two crew availabilities for the same crew member and period are merged into one.
