// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the kit's pure core and its stylesheet. Run: node --test 'kit/**/*.test.js'
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const kit = require('./kit.js');

const css = fs.readFileSync(path.join(__dirname, 'kit.css'), 'utf8');

test('rng is deterministic per seed and in range', () => {
  const a = kit.rng(42), b = kit.rng(42), c = kit.rng(43);
  const xs = Array.from({ length: 100 }, () => a());
  assert.deepEqual(xs, Array.from({ length: 100 }, () => b()));
  assert.notDeepEqual(xs, Array.from({ length: 100 }, () => c()));
  assert.ok(xs.every((x) => x >= 0 && x < 1));
  const r = kit.rng(7);
  assert.ok(Array.from({ length: 200 }, () => r.int(6)).every((x) => Number.isInteger(x) && x >= 0 && x < 6));
});

test('stateAt replays step n with n = 1..N', () => {
  const def = { initial: () => ({ seen: [] }), step: (s, n) => ({ seen: s.seen.concat(n) }) };
  assert.deepEqual(kit.stateAt(def, {}, 0), { seen: [] });
  assert.deepEqual(kit.stateAt(def, {}, 3), { seen: [1, 2, 3] });
});

test('defaultsOf takes spec values, then def.defaults; skips buttons', () => {
  const def = { params: [{ key: 'a', type: 'range', value: 1 }, { key: 'b', type: 'toggle', value: false }, { type: 'button', label: 'x' }], defaults: { b: true } };
  assert.deepEqual(kit.defaultsOf(def), { a: 1, b: true });
});

test('stepsOf accepts a number or a function of params', () => {
  assert.equal(kit.stepsOf({ steps: 12 }, {}), 12);
  assert.equal(kit.stepsOf({ steps: (p) => p.k * 2 }, { k: 4 }), 8);
  assert.equal(kit.stepsOf({}, {}), 0);
});

test('back link goes back in history only from the index or a course page', () => {
  const back = 'https://materijali.online/simdeck/index.html';
  const yes = ['https://materijali.online/simdeck/index.html', 'https://materijali.online/simdeck/',
    'https://materijali.online/simdeck/index.html?q=dns', 'https://materijali.online/simdeck/courses/linux-essentials/',
    'https://materijali.online/simdeck/courses/linux-essentials/index.html'];
  const no = ['', 'https://materijali.online/ossim/index.html', 'https://example.org/simdeck/index.html',
    'https://materijali.online/simdeck/sims/dns-resolution/index.html', 'https://materijali.online/simdeck/courses/',
    'https://materijali.online/simdeck/courses/a/b/', 'https://materijali.online/linux', 'not a url'];
  for (const r of yes) assert.equal(kit.cameFromSite(r, back), true, r);
  for (const r of no) assert.equal(kit.cameFromSite(r, back), false, r);
  // Unbuilt from file:// the index is the repo root; the rule is the same.
  assert.equal(kit.cameFromSite('file:///repo/courses/os/index.html', 'file:///repo/index.html'), true);
});

test('back link returns to the lecture set the home page stored, only on this site\'s index with ?set=', () => {
  const back = 'https://materijali.online/simdeck/index.html?lang=hr';
  const set = 'https://materijali.online/simdeck/index.html?set=vlan,stp:broadcast-storm#2';
  assert.equal(kit.setReturn(set, back, 'en'), 'https://materijali.online/simdeck/index.html?set=vlan%2Cstp%3Abroadcast-storm&lang=en#2');
  assert.equal(kit.setReturn(set, back, null), set, 'the stored address as it is when the sim has one language');
  assert.equal(kit.setReturn('https://materijali.online/simdeck/?set=a', back, null), 'https://materijali.online/simdeck/?set=a', 'the folder URL');
  for (const no of [null, '', 'not a url', 'https://materijali.online/simdeck/index.html', 'https://materijali.online/simdeck/index.html?q=set',
    'https://example.org/simdeck/index.html?set=a', 'https://materijali.online/other/index.html?set=a',
    'https://materijali.online/simdeck/courses/x/index.html?set=a']) assert.equal(kit.setReturn(no, back, 'hr'), null, String(no));
  // Unbuilt or from a USB stick: file:// has no referrer, so this is the only way back to the set.
  assert.equal(kit.setReturn('file:///usb/simdeck/index.html?set=a#1', 'file:///usb/simdeck/index.html', 'hr'), 'file:///usb/simdeck/index.html?set=a&lang=hr#1');
});

// ── stylesheet rules ──

const tokenBlock = (marker) => {
  const i = css.indexOf(marker);
  return new Set([...css.slice(i, css.indexOf('/* end tokens */', i)).matchAll(/(--[\w-]+):/g)].map((m) => m[1]));
};

test('dark theme redefines every light colour token', () => {
  const light = tokenBlock('/* tokens:light */');
  const dark = tokenBlock('/* tokens:dark */');
  assert.ok(light.size >= 20);
  assert.deepEqual([...light].filter((t) => !dark.has(t)), []);
  assert.deepEqual([...dark].filter((t) => !light.has(t)), []);
});

function undefinedVars(sources) {
  const all = sources.join('\n');
  const defined = new Set([...all.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));
  // Custom properties set from script, e.g. style: { '--bits': ... }
  for (const m of all.matchAll(/'(--[\w-]+)'\s*:/g)) defined.add(m[1]);
  return [...new Set([...all.matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1]))].filter((v) => !defined.has(v));
}

test('every var(--x) in the kit and template is defined', () => {
  const page = fs.readFileSync(path.join(__dirname, 'template', 'index.html'), 'utf8');
  assert.deepEqual(undefinedVars([css, page]), []);
});

test('the undefined-var check can fail', () => {
  assert.deepEqual(undefinedVars([':root{--a:1} x{color:var(--a);background:var(--nope)}']), ['--nope']);
});

test('palette contrast passes in both themes (kit/tools/contrast.mjs)', () => {
  execFileSync(process.execPath, [path.join(__dirname, 'tools', 'contrast.mjs')], { stdio: 'pipe' });
});

test('no font size under the 16 px floor in kit.css', () => {
  // px sizes must be >= 16; rem/em sizes are checked in the browser (kit/tools/check-page.mjs).
  const bad = [...css.matchAll(/font-size:\s*([\d.]+)px/g)].filter((m) => Number(m[1]) < 16);
  assert.deepEqual(bad.map((m) => m[0]), []);
});

// ── languages: string tables, plurals, glossary terms (docs/sim-ui.md §9) ──

const table = (over = {}) => Object.assign({
  hr: { a: 'Korak {n}', bits: ['{n} bit', '{n} bita', '{n} bitova'], t: 'Pojam [[carry]].' },
  en: { a: 'Step {n}', bits: ['{n} bit', '{n} bits'], t: 'Term [[carry]].' }
}, over);
const gloss = kit.glossaryIndex([{ en: 'carry', hr: 'prijenos', src: 'test' }]);

test('checkStrings: matching tables pass', () => {
  assert.deepEqual(kit.checkStrings(table(), { glossary: gloss }), []);
});

test('checkStrings fails a key that exists in one language only', () => {
  const t = table();
  delete t.en.a;
  assert.deepEqual(kit.checkStrings(t), ['"a" is missing in en']);
  t.en.extra = 'x';
  assert.match(kit.checkStrings(t).join('\n'), /"extra" is missing in hr/);
});

test('checkStrings fails a missing language, an unknown one, empty text and mismatched placeholders', () => {
  assert.deepEqual(kit.checkStrings({ hr: { a: 'x' } }), ['missing language "en"']);
  assert.match(kit.checkStrings(table({ de: {} })).join(), /unknown language "de"/);
  assert.match(kit.checkStrings(table({ en: { a: ' ', bits: ['{n} bit', '{n} bits'], t: 'T [[carry]]' } })).join(), /"a" in en must be a non-empty string/);
  assert.match(kit.checkStrings(table({ en: { a: 'Step {k}', bits: ['{n} bit', '{n} bits'], t: 'T [[carry]]' } })).join(), /"a" differs between languages/);
  assert.match(kit.checkStrings(table({ en: { a: ['Step {n}', 'Steps {n}'], bits: ['{n} bit', '{n} bits'], t: 'T [[carry]]' } })).join(), /"a" differs between languages \(plural/);
});

test('checkStrings: plural forms are hr 3, en 2; unknown glossary terms fail', () => {
  assert.match(kit.checkStrings(table({ hr: { a: 'K {n}', bits: ['{n} bit', '{n} bitova'], t: 'P [[carry]]' } })).join(), /"bits" in hr needs 3 plural forms, has 2/);
  assert.match(kit.checkStrings(table(), { glossary: kit.glossaryIndex([]) }).join(), /\[\[carry\]\] is not in the glossary/);
});

test('checkStrings: a single-language page checks only its language', () => {
  assert.deepEqual(kit.checkStrings({ en: { a: 'x' } }, { languages: ['en'] }), []);
});

test('pluralIndex: Croatian 1 / 2–4 / 5+ with 11–14, English 1 / other', () => {
  const hr = [1, 2, 4, 5, 11, 12, 14, 21, 22, 25, 101, 112, 0].map((n) => kit.pluralIndex('hr', n));
  assert.deepEqual(hr, [0, 1, 1, 2, 2, 2, 2, 0, 1, 2, 0, 2, 2]);
  assert.deepEqual([0, 1, 2, 21].map((n) => kit.pluralIndex('en', n)), [1, 0, 1, 1]);
});

test('format fills {placeholders}, leaves unknown ones', () => {
  assert.equal(kit.format('{a} + {b} = {c}', { a: 1, b: 2 }), '1 + 2 = {c}');
});

test('glossary terms: first mention "en (hr)" on Croatian pages, later mentions and English pages the English term', () => {
  assert.equal(kit.expandTerms('a [[carry]] b', 'hr', gloss, 'text'), 'a carry (prijenos) b');
  assert.equal(kit.expandTerms('a [[Carry]]', 'hr', gloss, 'html'), 'a <em lang="en">carry</em> (prijenos)');
  assert.equal(kit.expandTerms('[[=carry]]', 'hr', gloss, 'html'), '<em lang="en">carry</em>');
  assert.equal(kit.expandTerms('a [[carry]]', 'en', gloss, 'html'), 'a carry');
  const missing = [];
  assert.equal(kit.expandTerms('[[nope]]', 'hr', gloss, 'text', (k) => missing.push(k)), 'nope');
  assert.deepEqual(missing, ['nope']);
});

test('textWords: lower-case letter words, placeholders dropped, diacritics kept', () => {
  assert.deepEqual(Object.keys(kit.textWords(['Korak {n}: Promijenila', 'čvor 3'])).sort(), ['korak', 'promijenila', 'čvor']);
});

test('the shared glossary: every entry has en, hr and src, and no English term twice', () => {
  const terms = require('./glossary.js');
  assert.ok(terms.length > 400);
  for (const t of terms) assert.ok(t.en && t.hr && t.src, JSON.stringify(t));
  const keys = terms.map((t) => t.en.toLowerCase());
  assert.deepEqual(keys.filter((k, i) => keys.indexOf(k) !== i), []);
});

test('the kit\'s own strings: same keys in hr and en', () => {
  const dom = fs.readFileSync(path.join(__dirname, 'kit.js'), 'utf8');
  const block = dom.slice(dom.indexOf('var STRINGS = {'), dom.indexOf('var docEl'));
  const keysOf = (l) => [...block.slice(block.indexOf(`${l}: {`)).split('}')[0].matchAll(/(\w+):\s*'/g)].map((m) => m[1]).sort();
  assert.ok(keysOf('hr').length > 20);
  assert.deepEqual(keysOf('hr'), keysOf('en'));
});
