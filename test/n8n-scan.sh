#!/usr/bin/env bash
# Runs n8n's community package scanner (@n8n/scan-community-package) against this checkout,
# the check n8n runs before it approves a new version. It lints the source (.ts) and the
# packed package (.js, package.json) with n8n's own rules and ignores eslint-disable comments,
# so anything suppressed inline in the repo still fails here.
#
# Usage: test/n8n-scan.sh [scanner-version]   (run `npm run build` first)
set -euo pipefail

VERSION="${1:-latest}"
REPO="$(cd "$(dirname "$0")/.." && pwd)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

cd "$WORK"
npm pack -q "@n8n/scan-community-package@$VERSION" >/dev/null
tar xzf n8n-scan-community-package-*.tgz
cd package
npm pkg get version
npm install -q --omit=dev --no-audit --no-fund --legacy-peer-deps >/dev/null
# @typescript-eslint/parser does not load the TypeScript 7 the scanner pins, and a
# community-nodes rule needs n8n-workflow; both are missing from its dependencies.
npm install -q --no-save --no-audit --no-fund --legacy-peer-deps typescript@5.9 n8n-workflow >/dev/null

(cd "$REPO" && npm pack -q --pack-destination "$WORK" >/dev/null)
mkdir "$WORK/dist-pkg"
tar xzf "$WORK"/n8n-nodes-rentman-*.tgz -C "$WORK/dist-pkg" --strip-components=1

cat > run.mjs <<'EOF'
import { analyzePackage, SOURCE_FILE_PATTERNS } from './scanner/scanner.mjs';
const [source, dist] = process.argv.slice(2);
let failed = false;
for (const [label, dir, patterns] of [
	['source', source, SOURCE_FILE_PATTERNS],
	['package', dist, ['**/*.js', 'package.json']],
]) {
	const result = await analyzePackage(dir, patterns);
	console.log(`${label}: ${result.passed ? 'passed' : result.message}`);
	if (result.details) console.log(result.details);
	failed ||= !result.passed;
}
process.exit(failed ? 1 : 0);
EOF
node run.mjs "$REPO" "$WORK/dist-pkg"
