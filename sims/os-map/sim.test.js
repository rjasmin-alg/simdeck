// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the os-map import (index.html is ossimulator's built single file). Run: node --test sims/os-map/sim.test.js
// ossimulator keeps the model's own tests; these check that the copy is the build, unchanged but for the import
// markers, and that the module ids the ?m=<id> deep links name are in it.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ID = 'os-map';
const MODULE = 'index';
// sha256 of ossimulator's dist-simdeck/os-map.html as imported (NOTES.md, "Import").
const BUILD_SHA256 = 'a9fdfc5e0c7e10b9d777af4fc74f82859342f2aae473c1209537d7e10eca7a64';
// Module ids the index entries may open with ?m=<id> to focus one module (NOTES.md, "Deep links").
const DEEP_LINKS = [
  'interrupts', 'processes', 'scheduling', 'memory-allocation', 'address-translation',
  'page-replacement', 'threads', 'sync', 'deadlock', 'io-techniques', 'disk-scheduling', 'raid-cache', 'drivers',
  'filesystem', 'syscalls', 'journey',
];

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const entry = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
const BLOCK = (id) => new RegExp(`  <script type="application/json" id="${id}">.*</script>\\n`);

/** The page with the import markers taken out: what ossimulator built. */
function unmarked(src) {
  return src
    .replace(`<html lang="hr" data-sim="${ID}">`, '<html lang="hr">')
    .replace(BLOCK('simdeck-meta'), '')
    .replace(BLOCK('simdeck-exceptions'), '');
}

test('the page is the ossimulator build except for the import markers', () => {
  const sha = crypto.createHash('sha256').update(unmarked(html)).digest('hex');
  assert.equal(sha, BUILD_SHA256);
});

test('removing any one marker is noticed (the hash check is not vacuous)', () => {
  assert.notEqual(unmarked(html), html);
  assert.notEqual(crypto.createHash('sha256').update(html).digest('hex'), BUILD_SHA256);
});

test('the markers: data-sim is the folder name, meta and exceptions blocks parse', () => {
  assert.match(html, new RegExp(`<html lang="hr" data-sim="${ID}">`));
  assert.equal(entry.id, ID);
  for (const id of ['simdeck-meta', 'simdeck-exceptions']) {
    const m = BLOCK(id).exec(html);
    assert.ok(m, `${id} block`);
    assert.doesNotThrow(() => JSON.parse(m[0].replace(/^.*?>/, '').replace(/<\/script>\n$/, '')));
  }
});

test('the meta placeholder matches sim.json', async () => {
  const { metaFor } = await import('../../lib/manifest.mjs');
  const m = /id="simdeck-meta">(.*)<\/script>/.exec(html);
  assert.deepEqual(JSON.parse(m[1]), metaFor(entry));
});

test('every deep-link module id is in the build\'s module list, and the page reads ?m=', () => {
  const list = /\[(`interrupts`(?:,`[a-z-]+`)*)\]/.exec(html);
  assert.ok(list, 'module id list');
  assert.deepEqual(list[1].split(',').map((x) => x.slice(1, -1)), DEEP_LINKS);
  assert.ok(html.includes('.get(`m`)'), '?m= is read');
});

test('both languages: no single-language exception, and the build reads the kit\'s language key', () => {
  assert.ok(!('languages' in entry), 'the ossimulator build carries hr and en since 93da8f8');
  assert.ok(html.includes("'simdeck.lang'"), 'simdeck.lang');
  assert.equal(entry.origin, `ossimulator/${MODULE}`);
});
