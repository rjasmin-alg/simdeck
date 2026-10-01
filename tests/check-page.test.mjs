// SPDX-License-Identifier: AGPL-3.0-or-later
// The browser page check (kit/tools/check-page.mjs) on the template, and on broken copies of it that it must fail:
// a string missing from one language's table, and a label typed into the page instead of taken from the tables.
// Needs Playwright's Chromium (npx playwright install chromium); without it these tests are skipped, and say so.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, cpSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const CHECK = join(ROOT, 'kit', 'tools', 'check-page.mjs');
const skip = existsSync(chromium.executablePath()) ? false : 'Chromium for Playwright is not installed (npx playwright install chromium)';

function run(page) {
  const r = spawnSync(process.execPath, [CHECK, page], { encoding: 'utf8', timeout: 120000 });
  return { code: r.status, out: `${r.stdout}${r.stderr}` };
}

/** A copy of the kit with the template edited by `edit(files)`, as kit/broken/. */
function broken(edit) {
  const d = mkdtempSync(join(tmpdir(), 'simdeck-check-'));
  cpSync(join(ROOT, 'kit'), join(d, 'kit'), { recursive: true });
  cpSync(join(d, 'kit', 'template'), join(d, 'kit', 'broken'), { recursive: true });
  const f = (n) => join(d, 'kit', 'broken', n);
  const files = { strings: readFileSync(f('strings.js'), 'utf8'), page: readFileSync(f('index.html'), 'utf8') };
  edit(files);
  writeFileSync(f('strings.js'), files.strings);
  writeFileSync(f('index.html'), files.page);
  return { page: f('index.html'), done: () => rmSync(d, { recursive: true, force: true }) };
}

test('the template passes the page check in both languages', { skip }, () => {
  const r = run(join(ROOT, 'kit', 'template', 'index.html'));
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /languages: hr, en/);
  assert.match(r.out, /ok {3}1920×1080 en light: every visible word is from the en tables/);
  assert.match(r.out, /ok {3}L switches hr -> en and keeps preset and step/);
});

test('the page check fails a page with a string missing in one language', { skip }, () => {
  const b = broken((x) => {
    const before = x.strings;
    x.strings = x.strings.replace("      legendChanged: 'changed in this step',\n", '');
    assert.notEqual(x.strings, before, 'the sample was edited');
  });
  try {
    const r = run(b.page);
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /FAIL en: string tables complete \(same keys in every language\) {2}"legendChanged" is missing in en/);
    assert.match(r.out, /FAIL 1920×1080 en light: no console errors or warnings .*missing string "legendChanged" \(en\)/);
    assert.match(r.out, /FAIL 1920×1080 en light: every visible word is from the en tables {2}"legendchanged"/, 'the key shown instead');
  } finally {
    b.done();
  }
});

test('the page check fails visible text that is not from the tables', { skip }, () => {
  const b = broken((x) => {
    const before = x.page;
    x.page = x.page.replace("label: t('places')", "label: 'Težine mjesta'");
    assert.notEqual(x.page, before, 'the sample was edited');
  });
  try {
    const r = run(b.page);
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /FAIL 1920×1080 en light: every visible word is from the en tables {2}"težine" in span/);
    assert.match(r.out, /ok {3}1920×1080 hr light: every visible word is from the hr tables/, 'Croatian words pass on the Croatian page');
  } finally {
    b.done();
  }
});
