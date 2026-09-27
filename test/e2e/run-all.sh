#!/bin/bash
# End-to-end check of every Rentman operation inside a real n8n instance against the mock API.
# Prerequisites (see README.md): env.sh next to this script, mock.js running on 127.0.0.1:443,
# and `127.0.0.1 api.rentman.net` in /etc/hosts.
set -e
H=$(cd "$(dirname "$0")" && pwd); REPO=$(cd "$H/../.." && pwd)
. "$H/env.sh"
PACK_DIR=$(mktemp -d)
(cd "$REPO" && npm run build >/dev/null && npm pack --pack-destination "$PACK_DIR" >/dev/null 2>&1)
mkdir -p "$N8N_USER_FOLDER/.n8n/nodes"
(cd "$N8N_USER_FOLDER/.n8n/nodes" && { [ -f package.json ] || echo '{"name":"installed-nodes","private":true}' > package.json; } && npm install "$PACK_DIR"/n8n-nodes-rentman-*.tgz --no-audit --no-fund >/dev/null 2>&1)
export N8N_LOG_LEVEL=info
"$N8N" import:credentials --input="$H/creds.json" 2>&1 | grep -i imported || true
rm -rf "$H/out" && node "$H/gen.js" "$REPO" "$H/out"
"$N8N" import:workflow --separate --input="$H/out/" 2>&1 | grep -i imported
for f in "$H"/out/wf*.json; do
	i=$(basename "$f" .json | sed 's/wf//')
	: > "$H/requests.jsonl"
	"$N8N" execute --id="rentmanTest$i" >/dev/null 2>"$H/out/err$i.log" || echo "execute $i failed"
	id=$(python3 -c "import sqlite3;print(sqlite3.connect('$N8N_USER_FOLDER/.n8n/database.sqlite').execute('select max(id) from execution_entity').fetchone()[0])")
	node "$H/extract.js" "$id" "$H/requests.jsonl" "$H/out/result$i.json"
done
node "$H/analyze.js" "$H/out"
node "$H/issues.js" "$H/out"
