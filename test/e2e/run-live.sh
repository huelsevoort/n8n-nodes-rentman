#!/bin/bash
# Runs every operation of the node inside a real n8n instance against the LIVE Rentman API.
# Prerequisites: env.sh (see env.example.sh, without the mock's NODE_EXTRA_CA_CERTS/NO_PROXY lines),
# RENTMAN_API_TOKEN exported, and NO /etc/hosts entry for api.rentman.net.
# Writes create records named "n8n-e2e TEST" and delete them again; see README.md for the few
# records Rentman's API cannot delete.
set -e
H=$(cd "$(dirname "$0")" && pwd); REPO=$(cd "$H/../.." && pwd)
. "$H/env.sh"
OUT=${1:-$H/live-out}
PACK_DIR=$(mktemp -d)
(cd "$REPO" && npm run build >/dev/null && npm pack --pack-destination "$PACK_DIR" >/dev/null 2>&1)
mkdir -p "$N8N_USER_FOLDER/.n8n/nodes"
(cd "$N8N_USER_FOLDER/.n8n/nodes" && { [ -f package.json ] || echo '{"name":"installed-nodes","private":true}' > package.json; } && npm install "$PACK_DIR"/n8n-nodes-rentman-*.tgz --no-audit --no-fund >/dev/null 2>&1)
CREDS=$(mktemp)
printf '[{"id":"rentmanLive","name":"Rentman Live","type":"rentmanApi","data":{"apiToken":"%s"}}]' "$RENTMAN_API_TOKEN" > "$CREDS"
"$N8N" import:credentials --input="$CREDS" >/dev/null 2>&1; rm -f "$CREDS"
mkdir -p "$OUT"
node "$H/live-reads.js" "$REPO" "$OUT/reads"
node "$H/live-pagination.js" "$OUT/pagination"
node "$H/live-writes.js" "$OUT/writes" || node "$H/live-cleanup.js" "$OUT/writes"
