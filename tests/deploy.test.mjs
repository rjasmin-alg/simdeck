// SPDX-License-Identifier: AGPL-3.0-or-later
// scripts/deploy.sh is outward-facing and is never run by the tests. These check its shape: the thumbnail step runs
// before the build, with the cache the build then reads, and can be skipped; the script parses.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SCRIPT = fileURLToPath(new URL('../scripts/deploy.sh', import.meta.url));
const sh = readFileSync(SCRIPT, 'utf8');

test('deploy.sh parses', () => {
  execFileSync('bash', ['-n', SCRIPT]);
});

test('deploy.sh shoots the thumbnails before it builds, and the build reads the same cache', () => {
  const thumbs = sh.indexOf('npm run thumbs -- --cache "$THUMBS"');
  const build = sh.indexOf('npm run build -- --thumbs "$THUMBS"');
  assert.ok(thumbs > 0 && build > thumbs, 'thumbs, then build');
  assert.match(sh, /THUMBS="\$ROOT\/\.cache\/thumbs"/, 'the checkout\'s cache, which survives between deploys');
  assert.match(sh, /SIMDECK_THUMBS:-1}" == "0"/, 'SIMDECK_THUMBS=0 skips it');
  assert.match(sh, /scripts\?\.thumbs/, 'only when main has the thumbs script');
  assert.doesNotMatch(sh, /&& npm ci/, 'no install in the export');
});
