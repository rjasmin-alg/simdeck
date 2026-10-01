#!/usr/bin/env bash
# SPDX-License-Identifier: AGPL-3.0-or-later
# Publishes the main branch of simdeck to https://materijali.online/simdeck/ (docs/deploy.md).
# Login: user deck, password *** (realm "simdeck"; see scripts/server-setup.sh, which must have run once).
#
# Always main, never the working tree: the script exports the committed `main` with git archive, so uncommitted
# files and other branches cannot be published by accident. Publishing is outward-facing: run it when asked.
#
# What goes up:
#   - if package.json on main has a "build" script: npm run build in the export, then dist/ (the site frame's
#     build uses Node's standard library only, so no npm ci: Playwright is a dev tool for checks, not for the build);
#   - otherwise the export itself, minus what is not for students (docs/, scripts/, tests, kit tooling, package files).
#   If the result has no index.html yet (the site frame is not built), a minimal list of the native sims is generated.
#   - source.tar.gz: the same main commit as a git archive (AGPL-3.0-or-later §13: every page links it while the
#     site sits behind basic auth; site.json "source" points elsewhere once there is a public repo).
#   - the nginx rules for short course addresses (materijali.online/<short>, set per course in the admin) go to
#     /etc/nginx/snippets/simdeck-short.conf, included by the vhost (scripts/server-setup.sh). Uploaded only when they
#     change, then nginx -t and reload; the previous file is restored if the test fails.
#
# Usage:
#   scripts/deploy.sh                 # publish main
#   scripts/deploy.sh --dry-run       # build, show what would change, touch nothing
#   SIMDECK_DEPLOY_HOST=… scripts/deploy.sh
#   SIMDECK_REF=<ref> scripts/deploy.sh --dry-run   # try another ref; only allowed with --dry-run
set -euo pipefail

SERVER="${SIMDECK_DEPLOY_HOST:-root@materijali.online}"
TARGET="/var/www/materijali-online/simdeck/"
SNIPPET="/etc/nginx/snippets/simdeck-short.conf"
URL="https://materijali.online/simdeck/"
AUTH="${SIMDECK_AUTH:-deck:***}"
REF="${SIMDECK_REF:-main}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DRY=""
[[ "${1:-}" == "--dry-run" ]] && DRY="--dry-run"
if [[ "$REF" != "main" && -z "$DRY" ]]; then
  echo "refusing: only main is published (SIMDECK_REF=$REF is allowed with --dry-run only)" >&2
  exit 1
fi

cd "$ROOT"
COMMIT="$(git rev-parse --verify "$REF^{commit}")"
echo "── export $REF ($(git log -1 --format='%h %s' "$COMMIT"))"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
mkdir "$WORK/src" "$WORK/stage"
git archive "$COMMIT" | tar -x -C "$WORK/src"

if [[ -f "$WORK/src/package.json" ]] && node -e 'process.exit(require(process.argv[1]).scripts?.build ? 0 : 1)' "$WORK/src/package.json"; then
  echo "── build (npm run build)"
  (cd "$WORK/src" && npm run build)
  rsync -a --exclude='.simdeck-site' "$WORK/src/dist/" "$WORK/stage/"
else
  echo "── no build script on $REF: publishing the static tree"
  rsync -a \
    --exclude='.git*' --exclude='node_modules/' --exclude='docs/' --exclude='scripts/' --exclude='.herdr-project/' \
    --exclude='package.json' --exclude='package-lock.json' --exclude='*.test.js' --exclude='*.test.mjs' \
    --exclude='kit/tools/' --exclude='kit/new-sim.sh' --exclude='README.md' \
    "$WORK/src/" "$WORK/stage/"
fi

if [[ ! -f "$WORK/stage/index.html" ]]; then
  echo "── no index.html on $REF: generating a minimal list of native sims"
  python3 - "$WORK/stage" "$COMMIT" <<'PY'
import html, json, os, re, sys
stage, commit = sys.argv[1], sys.argv[2]
items = []
for d, _, files in os.walk(stage):
    if 'index.html' not in files or d == stage:
        continue
    text = open(os.path.join(d, 'index.html'), encoding='utf-8').read()
    m = re.search(r'<script type="application/json" id="simdeck-meta">(.*?)</script>', text, re.S)
    if not m:
        continue
    meta = json.loads(m.group(1))
    items.append((meta.get('title', d), os.path.relpath(os.path.join(d, 'index.html'), stage), meta.get('summary', '')))
items.sort()
li = '\n'.join(f'<li><a href="{html.escape(p)}">{html.escape(t)}</a> {html.escape(s)}</li>' for t, p, s in items)
open(os.path.join(stage, 'index.html'), 'w', encoding='utf-8').write(f'''<!doctype html>
<html lang="hr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>simdeck</title>
<style>body{{font:20px/1.4 system-ui,sans-serif;margin:2em auto;max-width:48em;padding:0 1em;color:#0f1a2c;background:#fbfaf6}}
a{{color:#1b4fc4;font-weight:700}} li{{margin:.4em 0}} small{{color:#475467}}</style></head>
<body><h1>simdeck</h1><p>Privremeni popis dok se ne izradi pravo kazalo.</p><ul>
{li}
</ul><p><small>main @ {commit[:7]}</small></p></body></html>
''')
print(f'{len(items)} sim(s) listed')
PY
fi
echo "$COMMIT" > "$WORK/stage/VERSION"
echo "── source archive (source.tar.gz, main @ ${COMMIT:0:7})"
git archive --format=tar.gz --prefix="simdeck-${COMMIT:0:7}/" "$COMMIT" > "$WORK/stage/source.tar.gz"

echo "── upload ${DRY:+(dry run) }→ ${SERVER}:${TARGET}"
# Owner and modes set explicitly: -a alone copies the local uid and the 700 mode of mktemp, and nginx answers 404.
timeout 300 rsync -rltz --delete --itemize-changes --chown=root:root --chmod=D755,F644 $DRY "$WORK/stage/" "${SERVER}:${TARGET}"

if [[ -f "$WORK/src/scripts/short-links.mjs" ]]; then
  echo "── short course addresses ${DRY:+(dry run) }→ ${SERVER}:${SNIPPET}"
  node "$WORK/src/scripts/short-links.mjs" --root "$WORK/src" > "$WORK/short.conf"
  rules="$(grep -v '^#' "$WORK/short.conf" || true)"
  echo "${rules:-(none)}" | sed 's/^/   /'
  # The rules travel base64-encoded in the command line: ssh forwards only stdin, which carries the script.
  timeout 120 ssh -o ConnectTimeout=10 "$SERVER" DRY="${DRY:+1}" SNIPPET="$SNIPPET" RULES="$(base64 -w0 "$WORK/short.conf")" bash -s <<'REMOTE'
set -euo pipefail
NEW=$(mktemp); printf '%s' "$RULES" | base64 -d > "$NEW"
if ! grep -q 'simdeck-short.conf' /etc/nginx/sites-available/materijali-online; then
  echo "   not included by the vhost yet: run scripts/server-setup.sh once (rules not installed)"
elif [[ -f $SNIPPET ]] && cmp -s "$NEW" "$SNIPPET"; then
  echo "   unchanged"
elif [[ -n $DRY ]]; then
  echo "   would update $SNIPPET:"; { diff -u "$SNIPPET" "$NEW" 2>/dev/null || true; } | sed -n '/^[-+][^-+]/p'
else
  [[ -f $SNIPPET ]] && cp -p "$SNIPPET" "$SNIPPET.prev"
  install -m 644 -o root -g root "$NEW" "$SNIPPET"
  if nginx -t 2>/dev/null; then systemctl reload nginx; echo "   updated, nginx reloaded"
  else
    if [[ -f $SNIPPET.prev ]]; then mv "$SNIPPET.prev" "$SNIPPET"; else : > "$SNIPPET"; fi
    echo "   nginx -t failed with the new rules; previous rules restored" >&2; exit 1
  fi
fi
rm -f "$NEW"
REMOTE
fi

[[ -n "$DRY" ]] && { echo "dry run: nothing changed on the server"; exit 0; }

echo "── check ${URL}"
anon="$(curl -s -o /dev/null -w '%{http_code}' "${URL}index.html")"
auth="$(curl -s -o /dev/null -w '%{http_code}' -u "$AUTH" "${URL}index.html")"
ver="$(curl -s -u "$AUTH" "${URL}VERSION")"
src="$(curl -s -o /dev/null -w '%{http_code}' -u "$AUTH" "${URL}source.tar.gz")"
[[ "$anon" == "401" ]] || { echo "expected 401 without login, got $anon" >&2; exit 1; }
[[ "$auth" == "200" ]] || { echo "expected 200 with login, got $auth" >&2; exit 1; }
[[ "$ver" == "$COMMIT" ]] || { echo "server VERSION is '$ver', expected $COMMIT" >&2; exit 1; }
[[ "$src" == "200" ]] || { echo "expected 200 for source.tar.gz, got $src" >&2; exit 1; }
echo "ok: 401 without login, 200 with ${AUTH%%:*}, serving main @ ${COMMIT:0:7} and its source.tar.gz"
