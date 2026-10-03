// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the io-techniques import (index.html is ossimulator's built single file). Run: node --test sims/io-techniques/sim.test.js
// ossimulator keeps the model's own tests; these check that the copy is the build, unchanged but for the import
// markers, and that the scenarios the deep links name are in it.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ID = 'io-techniques';
// sha256 of ossimulator's dist-simdeck/io-techniques.html as imported (NOTES.md, "Import").
const BUILD_SHA256 = 'a18f9adc7a2cfe21a8072675513122421da98ee006b5986ef514ba1f66572803';
// Scenario ids the index entries should open with ?scenario=<id> (NOTES.md, "Deep links").
const DEEP_LINKS = ['three-techniques', 'buffering-compare'];

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

test('every deep-link scenario id is in the build', () => {
  for (const id of DEEP_LINKS) assert.ok(html.includes(`id:\`${id}\``), id);
  assert.ok(!html.includes('id:`no-such-scenario`'));
});

test('sim.json declares the single-language exception and the origin', () => {
  assert.deepEqual(entry.languages, ['hr']);
  assert.equal(entry.origin, `ossimulator/${ID}`);
});
