# End-to-end test against a mocked Rentman API

Runs every resource/operation of the node inside a real n8n instance, twice per operation:

- **min**: only required parameters.
- **full**: every optional field, filter, Expand and Custom Query Parameters (including a blank row) filled in.

`mock.js` impersonates `api.rentman.net` over HTTPS and echoes each request back. `analyze.js` then checks, per operation, the HTTP method, the exact path (IDs substituted), the auth header, that every filled field arrived under the right query/body key, that dates carry the workflow timezone's offset, and that every create/update sends a JSON object body (`{}` without optional fields). `issues.js` runs n8n's own parameter validator (the check behind "The workflow has issues") on every parameter set. `pagination-check.js` runs `pagination-wf.json` and checks that **Return All** follows `next_page_url` across three pages without re-sending Sort, Limit or Offset.

The mock accepts every request, so this shows what the node sends, not whether Rentman accepts it; that is what the live run below is for.

## Setup

```bash
npm install n8n                     # in a scratch directory; n8n 2.x needs Node.js >= 24
cp env.example.sh env.sh            # and fill in the paths
openssl req -x509 -newkey rsa:2048 -nodes -keyout key.pem -out cert.pem -days 7 \
  -subj "/CN=api.rentman.net" -addext "subjectAltName=DNS:api.rentman.net"
echo "127.0.0.1 api.rentman.net" | sudo tee -a /etc/hosts
sudo node mock.js requests.jsonl &  # port 443 needs root; reads key.pem/cert.pem next to mock.js
OLD_BUILD=/tmp/old ./run-all.sh     # OLD_BUILD (optional): built previous release for the upgrade check
```

The scripts also need `python3` (to read n8n's SQLite database). `requests.jsonl` logs every request including its Authorization header; the credential in `creds.json` is the mock's dummy token.

Remove the `/etc/hosts` line afterwards, otherwise n8n on this machine keeps talking to the mock.

# Upgrade check

`upgrade-check.js` makes sure workflows saved with the previous release keep running. It generates every operation of the old build (required only and all optional fields), loads those parameters into the new build the way n8n opens a saved workflow, and fails when
- n8n's parameter validator reports issues ("The workflow has issues"), e.g. a new required parameter,
- a value the old workflow set is dropped (a field moved or renamed) or an options value is no longer offered,
- a value the old workflow did not set is now sent by default.

Removals the CHANGELOG lists as breaking are allowed in its `ALLOWED` list.

```bash
npm run build
git worktree add /tmp/old v26.5.0-1.13.0 && (cd /tmp/old && npm ci && npm run build)
node test/e2e/upgrade-check.js /tmp/old "$PWD" /path/to/n8n/node_modules /tmp/upgrade-check
```

# Live run against the real Rentman API

`run-live.sh` runs the same node inside n8n against `api.rentman.net` itself. **Only run it against a test account**: the writes create records the API cannot delete, book a payment of 0 on the first invoice and a leave mutation on a real (inactive) crew member. `live-writes.js` prints the account (its first project and first contact) and refuses to write unless `RENTMAN_LIVE_WRITE_ACK` is set to that first project's name.

```bash
export RENTMAN_API_TOKEN=...        # the token the node's credential gets
# env.sh as above, but without the NODE_EXTRA_CA_CERTS / NO_PROXY lines and without the /etc/hosts entry
export GENERIC_TIMEZONE=Europe/Berlin
export RENTMAN_LIVE_WRITE_ACK="<first project of the test account>"
./run-live.sh /tmp/rentman-live
```

- `live-reads.js`: every read operation. For each resource it picks a real record X, checks that Get returns X, and runs Get Many three times: limit 1, offset 1, and with every filter, Fields, Sort, Expand and Custom Query Parameters (plus a blank row) set from X's own values, which must still return X. Every value of every choice filter (options and booleans) runs on its own and must only return matching records. Every sub-collection getter and every Get For Parent (each parent type of each resource) runs against a real parent, plain and with all its filters, Fields, Sort, Expand and Custom Query Parameters.
- `live-pagination.js`: Return All with small pages (Custom Query Parameter `limit`) combined with filters, Fields, Sort and Expand, compared item by item with the same list read directly.
- `live-writes.js`: every create, update and delete. Records are named `n8n-e2e TEST` and logged to `created.json`. After each create and update the record is read back and every sent field is compared with what Rentman stored; a difference fails the case unless `KNOWN_NOT_STORED` lists it as reproduced Rentman behavior. A case whose parameters n8n would drop when loading the workflow fails too, so every field a case sets really reaches Rentman. The token is passed to curl on stdin, not as an argument. Everything that can be deleted is deleted at the end; `live-cleanup.js <dir>` deletes leftovers after an aborted run.

Rentman's API cannot delete projects, subprojects, project functions, project function groups, equipment, folders, leave mutations, leave requests, the hours of approved leave requests, or payments. Each live write run leaves these behind (named `n8n-e2e TEST`, two leave requests and the hours of the approved one, the payment has amount 0 on the first invoice); remove them in Rentman afterwards.

Known Rentman-side results in the live run (not node bugs, each reproduced directly against the API):
- Task Status → Create/Update needs a token user who may manage task statuses (HTTP 401 on create, 404 on update otherwise; reading works).
- Leave Request → Approve/Reject needs hours on the request (Time Registration → Create For Leave Request), otherwise HTTP 500. Rentman also refuses some status changes: approved → rejected, and anything out of canceled. Once a request was approved (also after canceling it) its hours can no longer be changed or deleted; the hours of a rejected request can.
- Serial Number → Active = false is ignored while the purchase date lies in the future.
- Contact → Type = Private clears Name, Type = Company clears First Name, Surname Prefix and Last Name.
- Equipment → Type is derived by Rentman (Case/Set from Is Combination); a value sent directly is ignored. Strict Container Content is not stored either, without an error, and Can Edit Content During Planning is stored only for virtual packages (sets).
- Changing Equipment → Stock Management to "Exclude from stock tracking" deletes that item's serial numbers and stock movements.
- Equipment → Temporary = true sets the code to TEMP and hides the equipment from every read (Get answers 404) until Temporary is set back to false.
- Two crew availabilities for the same crew member and period are merged into one. Recurrence End Date keeps only the date, and Last Updated / Last Updater are always set by Rentman (the node does not offer them).
- Stock Movement → API Client is always set by Rentman (`not_set:1.16.0`), so the node does not offer it.
- Time Registration → Create without a Leave Type fails with HTTP 500. Duration is computed from start and end for worked hours, and Correction Duration is stored only on registrations with a correction leave type (whose end Rentman sets to the start).
- Project → Create → Number is kept only when it is all digits; otherwise Rentman assigns the next number.
- Task → Time Budget is reset to 0 when Assignment Type is Creator Only.
- Payment → Import Source "publicapi" does not appear in Rentman's responses; the accounting sources (e.g. Xero) do.
