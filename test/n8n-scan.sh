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

# The scanner module moved from scanner/scanner.mjs to dist/scanner.js in 0.43.0, and
# 0.44.0 renamed analyzePackage(dir, patterns) to lintDirectory(dir, patterns).
SCANNER=./dist/scanner.js
[ -f scanner/scanner.mjs ] && SCANNER=./scanner/scanner.mjs

cat > run.mjs <<'EOF'
import * as scanner from 'SCANNER_MODULE';
const { SOURCE_FILE_PATTERNS } = scanner;
const analyzePackage = scanner.lintDirectory ?? scanner.analyzePackage;
if (typeof analyzePackage !== 'function' || !SOURCE_FILE_PATTERNS) {
	console.error('Scanner API changed: lintDirectory/analyzePackage or SOURCE_FILE_PATTERNS not found');
	process.exit(1);
}
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
sed "s#SCANNER_MODULE#$SCANNER#" run.mjs > scan.mjs
node scan.mjs "$REPO" "$WORK/dist-pkg"
