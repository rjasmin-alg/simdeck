#!/usr/bin/env bash
# SPDX-License-Identifier: AGPL-3.0-or-later
# One-time (idempotent) server setup for https://materijali.online/simdeck/ (docs/deploy.md).
#
# One nginx location in the materijali-online vhost. The site is public: no login.
#
# What it does on the server (each step is skipped if already done):
#   1. backs up the vhost as materijali-online.bak-<date>, then adds `location /simdeck/` after the /ossim/ block,
#      or replaces an older /simdeck/ block that still asks for a login (the site was behind basic auth until
#      2026-11-11);
#   2. removes /etc/nginx/.htpasswd-simdeck, left over from that login;
#   3. creates /var/www/materijali-online/simdeck/ with a "coming soon" page if it is empty;
#   3b. includes /etc/nginx/snippets/simdeck-short.conf in the vhost, after the /simdeck/ location (an empty file at
#       first): the short course addresses (materijali.online/<short>) that scripts/deploy.sh keeps up to date;
#   4. nginx -t, and only then reload; restores the backup if the test fails;
#   5. checks that the page answers 200 without a login.
#
# Usage:
#   scripts/server-setup.sh --dry-run   # show what would change, touch nothing
#   scripts/server-setup.sh             # apply
#   SIMDECK_DEPLOY_HOST=… scripts/server-setup.sh
set -euo pipefail

SERVER="${SIMDECK_DEPLOY_HOST:-root@materijali.online}"
URL="https://materijali.online/simdeck/"
DRY=0
[[ "${1:-}" == "--dry-run" ]] && DRY=1

echo "── server setup on ${SERVER} ${DRY:+}$([[ $DRY == 1 ]] && echo '(dry run)')"
timeout 120 ssh -o ConnectTimeout=10 "$SERVER" DRY="$DRY" bash -s <<'REMOTE'
set -euo pipefail
VHOST=/etc/nginx/sites-available/materijali-online
HTPASSWD=/etc/nginx/.htpasswd-simdeck
TARGET=/var/www/materijali-online/simdeck
run() { if [[ $DRY == 1 ]]; then echo "would: $*"; else "$@"; fi; }

# 1. nginx location: added after /ossim/, or an older /simdeck/ block (with its comment) replaced
NEW=$(mktemp)
python3 - "$VHOST" "$NEW" <<'PY'
import sys
src, dst = sys.argv[1], sys.argv[2]
lines = open(src).read().split('\n')
block = '''
    # /simdeck = simdeck: kratki simulatori za predavanja (jedan pojam po stranici) i
    # popisi po kolegiju. Staticne datoteke, javno dostupne; objavljuje ih skripta
    # scripts/deploy.sh iz grane main.
    location /simdeck/ {
        try_files $uri $uri/ =404;
    }'''.split('\n')
loc = next((i for i, l in enumerate(lines) if l.strip() == 'location /simdeck/ {'), None)
if loc is None:
    start = next(i for i, l in enumerate(lines) if l.strip() == 'location /ossim/ {')
    end = next(i for i in range(start, len(lines)) if lines[i] == '    }')
    out = lines[:end + 1] + block + lines[end + 1:]
else:
    first = loc
    while first > 0 and lines[first - 1].strip().startswith('#'):
        first -= 1
    if first > 0 and lines[first - 1].strip() == '':
        first -= 1
    end = next(i for i in range(loc, len(lines)) if lines[i] == '    }')
    out = lines[:first] + block + lines[end + 1:]
open(dst, 'w').write('\n'.join(out))
PY
if cmp -s "$VHOST" "$NEW"; then
  echo "ok: location /simdeck/ in $VHOST is current (public)"
  CHANGED=0
else
  echo "location /simdeck/ to write:"
  diff -u "$VHOST" "$NEW" | sed -n '/^[-+] /p' || true
  if [[ $DRY == 0 ]]; then
    cp -p "$VHOST" "$VHOST.bak-$(date +%Y%m%d-%H%M%S)"
    cat "$NEW" > "$VHOST"
  fi
  CHANGED=1
fi
rm -f "$NEW"

# 2. leftover login file
if [[ -f $HTPASSWD ]]; then
  run rm -f "$HTPASSWD"
else
  echo "ok: no $HTPASSWD"
fi

# 3. target directory
if [[ -d $TARGET ]] && [[ -n "$(ls -A "$TARGET")" ]]; then
  echo "ok: $TARGET exists and is not empty"
else
  run install -d -o root -g root -m 755 "$TARGET"
  if [[ $DRY == 0 ]]; then
    printf '%s\n' '<!doctype html><html lang="hr"><meta charset="utf-8"><title>simdeck</title>' \
      '<p style="font:20px system-ui;margin:3em">simdeck: u pripremi.</p></html>' > "$TARGET/index.html"
    chmod 644 "$TARGET/index.html"
  else
    echo "would: write a placeholder $TARGET/index.html"
  fi
fi

# 3b. short course addresses: an include after the /simdeck/ location; scripts/deploy.sh writes the file
SNIPPET=/etc/nginx/snippets/simdeck-short.conf
if [[ ! -f $SNIPPET ]]; then
  run install -d -m 755 /etc/nginx/snippets
  if [[ $DRY == 0 ]]; then printf '# simdeck: short course addresses (written by scripts/deploy.sh)\n' > "$SNIPPET"; chmod 644 "$SNIPPET"
  else echo "would: create an empty $SNIPPET"; fi
fi
if grep -q 'simdeck-short.conf' "$VHOST"; then
  echo "ok: $VHOST includes $SNIPPET"
elif ! grep -q 'location /simdeck/' "$VHOST"; then
  echo "would: include $SNIPPET after location /simdeck/ (once that location exists)"
else
  NEW=$(mktemp)
  python3 - "$VHOST" "$NEW" "$SNIPPET" <<'PY'
import sys
src, dst, snippet = sys.argv[1:4]
lines = open(src).read().split('\n')
start = next(i for i, l in enumerate(lines) if l.strip() == 'location /simdeck/ {')
end = next(i for i in range(start, len(lines)) if lines[i] == '    }')
inc = ['', '    # simdeck: kratke adrese kolegija (materijali.online/<kratko>); datoteku piše scripts/deploy.sh.',
       f'    include {snippet};']
open(dst, 'w').write('\n'.join(lines[:end + 1] + inc + lines[end + 1:]))
PY
  echo "include to add (after /simdeck/):"
  diff -u "$VHOST" "$NEW" | sed -n '/^+/p' || true
  if [[ $DRY == 0 ]]; then
    cp -p "$VHOST" "$VHOST.bak-$(date +%Y%m%d-%H%M%S)"
    cat "$NEW" > "$VHOST"
  fi
  rm -f "$NEW"
  CHANGED=1
fi

# 4. test and reload
if [[ $DRY == 0 && $CHANGED == 1 ]]; then
  if nginx -t; then
    systemctl reload nginx
    echo "ok: nginx reloaded"
  else
    latest=$(ls -t "$VHOST".bak-* | head -1)
    echo "nginx -t failed, restoring $latest" >&2
    cp -p "$latest" "$VHOST"
    exit 1
  fi
fi
REMOTE

[[ $DRY == 1 ]] && { echo "dry run: nothing changed on the server"; exit 0; }

echo "── check ${URL}"
page="$(curl -s -o /dev/null -w '%{http_code}' "${URL}")"
[[ "$page" == "200" ]] || { echo "expected 200 without a login, got $page" >&2; exit 1; }
echo "ok: ${URL} is public (200)"
