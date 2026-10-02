// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the faultline import. Run: node --test sims/faultline/sim.test.js
// The app is ES modules in js/, bundled once into app.js (bundle.mjs). These tests check the bundler and the bundle,
// the two languages (tables, keys, plurals, the names the engine writes in English), the samples and the import
// markers; run the app's own 47 checks (node tests/run.mjs); and open the page in Chromium from file://, every sample
// in both languages, breaking an event and a cut, with no console error and no missing string.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');
const { pathToFileURL } = require('node:url');
const kit = require('../../kit/kit.js');
const strings = require('./strings.js');

const ID = 'faultline';
const DIR = __dirname;
const read = (f) => fs.readFileSync(path.join(DIR, f), 'utf8');
const html = read('index.html');
const entry = JSON.parse(read('sim.json'));
// The task's sample keys (the app's own ids, used in ?sample=) and the kebab-case preset ids of sim.json.
const SAMPLES = { threeZone: 'three-zone', onePdu: 'one-pdu', sizeTwo: 'size-two', usEast1: 'us-east-1', frontDoor: 'front-door' };

/** Every .js file under js/, as paths relative to js/. */
function jsFiles(dir = path.join(DIR, 'js'), base = '') {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory()
    ? jsFiles(path.join(dir, d.name), `${base}${d.name}/`)
    : d.name.endsWith('.js') ? [`${base}${d.name}`] : []));
}

/** A fresh copy of the bundle in a vm, not booted; `env` sets location, localStorage and <html lang>. */
function loadApp(env = {}) {
  const errors = [];
  const store = new Map(Object.entries(env.stored || {}));
  const sandbox = {
    console: { log() {}, warn() {}, error: (...a) => errors.push(a.join(' ')) },
    SimStrings: strings,
    FAULTLINE_NO_BOOT: true,
    URLSearchParams,
    localStorage: { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) },
    document: { documentElement: { lang: env.htmlLang ?? 'hr', dataset: {} } },
  };
  if (env.search !== undefined) sandbox.location = { search: env.search };
  vm.createContext(sandbox);
  vm.runInContext(read('app.js'), sandbox, { filename: 'app.js' });
  return { M: sandbox.Faultline.modules, errors };
}

// ── the bundle ──

test('app.js is what bundle.mjs makes of js/ (no hand edits, not stale)', async () => {
  const { bundle } = await import(pathToFileURL(path.join(DIR, 'bundle.mjs')).href);
  assert.equal(read('app.js'), bundle());
});

test('bundler: subfolder paths, named imports with `as`, the export forms, dependency order', async () => {
  const { transform, order, resolve } = await import(pathToFileURL(path.join(DIR, 'bundle.mjs')).href);
  assert.equal(resolve('engine/cutset', './graph.js'), 'engine/graph');
  assert.equal(resolve('main', './engine/authorities.js'), 'engine/authorities');
  assert.equal(resolve('engine/x', '../i18n.js'), 'i18n');
  assert.throws(() => resolve('main', '../outside.js'), /leaves js/);
  const m = transform('engine/x', "import {\n  a, b as c,\n} from './y.js';\nimport { d } from '../z.js';\n"
    + 'export const K = 1;\nexport class C {}\nexport function f() {}\nfunction g() {}\nexport { g };\n');
  assert.deepEqual(m.deps, ['engine/y', 'z']);
  assert.match(m.body, /const \{ a, b: c \} = __mods\["engine\/y"\];/);
  assert.deepEqual(m.exports.sort(), ['C', 'K', 'f', 'g']);
  assert.doesNotMatch(m.body, /^\s*(import|export)\b/m);
  const mods = new Map([['main', { deps: ['b', 'a'] }], ['a', { deps: [] }], ['b', { deps: ['a'] }]]);
  assert.deepEqual(order(mods, 'main'), ['a', 'b', 'main']);
});

test('bundler refuses what it cannot bundle: default exports, namespace imports, bare specifiers, cycles, missing modules', async () => {
  const { transform, order } = await import(pathToFileURL(path.join(DIR, 'bundle.mjs')).href);
  assert.throws(() => transform('x', 'export default 1;\n'), /cannot bundle/);
  assert.throws(() => transform('x', "import * as y from './y.js';\n"), /cannot bundle/);
  assert.throws(() => transform('x', "import { y } from 'y';\n"), /cannot bundle/);
  assert.throws(() => order(new Map([['main', { deps: ['a'] }], ['a', { deps: ['main'] }]]), 'main'), /cycle/);
  assert.throws(() => order(new Map([['main', { deps: ['a'] }]]), 'main'), /missing module a\.js/);
});

test('the page loads strings.js, then app.js, as classic scripts (the build inlines no modules)', () => {
  assert.doesNotMatch(html, /type="module"/);
  const s = html.indexOf('<script src="strings.js"></script>');
  const a = html.indexOf('<script src="app.js"></script>');
  assert.ok(s > 0 && a > s);
});

test('the bundle loads in a bare context and boots nothing without a page', () => {
  const { M, errors } = loadApp({ search: '?lang=en' });
  assert.ok(M.main === undefined, 'main must not run under FAULTLINE_NO_BOOT');
  assert.ok(M['engine/cutset'] && M.compile && M.samples && M.i18n && M.render);
  assert.deepEqual(errors, []);
});

test('the engine stays as imported: js/engine/ does not know about languages', () => {
  for (const f of jsFiles().filter((x) => x.startsWith('engine/'))) {
    assert.doesNotMatch(read(`js/${f}`), /i18n|\bt\(|simdeck/, f);
  }
});

// ── languages ──

test('both string tables have the same keys, plural shapes and placeholders', () => {
  assert.deepEqual(kit.checkStrings(strings), []);
});

test('language: ?lang= wins, then the stored simdeck choice, then <html lang>; unknown values are skipped', () => {
  const lang = (env) => loadApp(env).M.i18n.lang();
  assert.equal(lang({ search: '?lang=en', stored: { 'simdeck.lang': 'hr' } }), 'en');
  assert.equal(lang({ search: '?lang=hr', stored: { 'simdeck.lang': 'en' } }), 'hr');
  assert.equal(lang({ search: '', stored: { 'simdeck.lang': 'en' } }), 'en');
  assert.equal(lang({ search: '?lang=de', stored: { 'simdeck.lang': 'xx' }, htmlLang: 'en' }), 'en');
  assert.equal(lang({ search: '', htmlLang: 'hr' }), 'hr');
});

test('Croatian plurals: 1 / 2–4 / 5+, and 11–14 take the third form', () => {
  const { M } = loadApp({ search: '?lang=hr' });
  const forms = strings.hr['st.cuts'];
  const n = (k) => M.i18n.t('st.cuts', { n: k });
  const want = (i, k) => forms[i].replace('{n}', k);
  assert.deepEqual([1, 2, 4, 5, 11, 12, 14, 21, 22, 25, 101].map(n),
    [want(0, 1), want(1, 2), want(1, 4), want(2, 5), want(2, 11), want(2, 12), want(2, 14), want(0, 21),
      want(1, 22), want(2, 25), want(0, 101)]);
  M.i18n.useLang('en');
  assert.deepEqual([1, 2, 11].map(n), ['1 cut', '2 cuts', '11 cuts']);
});

test('every literal t() key and data-t* key in the page and js/ is in the table, and every table key is used', () => {
  const sources = [html, ...jsFiles().map((f) => read(`js/${f}`))].join('\n');
  const keys = new Set();
  for (const m of sources.matchAll(/\bt\('([\w.-]+)'/g)) keys.add(m[1]);
  for (const m of sources.matchAll(/data-t(?:-title|-label|-placeholder)?="([\w.-]+)"/g)) keys.add(m[1]);
  assert.ok(keys.size > 50, `found ${keys.size} keys`);
  for (const k of keys) for (const l of ['hr', 'en']) assert.ok(k in strings[l], `${l}: ${k}`);
  // Built keys: role.<role>, kind.<kind>, scope1|scopeN.<scope>, auth|authq.<kind>, the two-word picks in main.js.
  const built = (k) => /^(role|kind|scope1|scopeN|auth|authq)\./.test(k) || /^(cut\.reveal(More|Zero)|st\.(up|down))$/.test(k);
  const unused = Object.keys(strings.en).filter((k) => !keys.has(k) && !built(k));
  assert.deepEqual(unused, []);
});

test('every role, domain kind and cut scope the samples produce has a word in both tables', () => {
  const { M, errors } = loadApp();
  const { analyse, invalidate } = M.compile;
  for (const key of Object.keys(SAMPLES)) {
    invalidate();
    const a = analyse(M.samples.makeSample(key));
    for (const c of a.doc.components) for (const l of ['hr', 'en']) assert.ok(`role.${c.role}` in strings[l], `${key}: role ${c.role}`);
    for (const d of a.doc.domains) for (const l of ['hr', 'en']) assert.ok(`kind.${d.kind}` in strings[l], `${key}: kind ${d.kind}`);
    for (const cut of a.services[0].cuts) {
      for (const l of ['hr', 'en']) {
        assert.ok(`scope1.${cut.scope}` in strings[l] && `scopeN.${cut.scope}` in strings[l], `${key}: scope ${cut.scope}`);
      }
    }
  }
  for (const a of M['engine/authorities'].IMPLICIT_AUTHORITIES) {
    for (const l of ['hr', 'en']) assert.ok(`auth.${a.kind}` in strings[l] && `authq.${a.kind}` in strings[l], a.kind);
    // The English table says what the engine says, so the English page reads as the original did.
    assert.equal(strings.en[`auth.${a.kind}`], a.name);
    assert.equal(strings.en[`authq.${a.kind}`], a.question);
  }
  assert.deepEqual(errors, []);
});

// ── samples (the preset entries) ──

test('sim.json entries are the five samples, by the app\'s own ?sample= keys', () => {
  const { M } = loadApp();
  assert.deepEqual(Object.keys(M.samples.SAMPLES), Object.keys(SAMPLES));
  assert.deepEqual(entry.entries.map((x) => [x.preset, x.query]),
    Object.entries(SAMPLES).map(([key, preset]) => [preset, `sample=${key}`]));
  assert.equal(M.samples.makeSample('no-such-sample'), null);
});

test('a sample is the same model in both languages, and so gives the same answer; only words change', () => {
  const { M } = loadApp();
  const { analyse, invalidate } = M.compile;
  const shape = (doc) => JSON.stringify({
    domains: doc.domains.map((d) => [d.id, d.kind, d.parent]),
    components: doc.components.map((c) => [c.id, c.role, c.domain, c.authorityKind]),
    deps: doc.deps, events: doc.events.map((e) => [e.id, e.hits]), settings: doc.settings,
  });
  // Cuts by event id; the order is compared as a set where the sort's last tie-break (the name) decides.
  const answer = (doc) => {
    invalidate();
    const s = analyse(doc).services[0];
    return { cuts: s.cuts.map((c) => c.events.map((e) => e.id).join('+')).sort(), searched: s.searched,
      drawn: s.drawnCuts.length, smallest: s.smallestDrawn && [s.smallestDrawn.size, s.smallestDrawn.scope, s.smallestDrawn.blastRadius] };
  };
  for (const key of Object.keys(SAMPLES)) {
    M.i18n.useLang('hr');
    const hr = M.samples.makeSample(key);
    const hrLabel = M.samples.SAMPLES[key].label;
    M.i18n.useLang('en');
    const en = M.samples.makeSample(key);
    assert.equal(shape(hr), shape(en), key);
    assert.deepEqual(answer(hr), answer(en), key);
    if (key !== 'sizeTwo') assert.notEqual(hrLabel, M.samples.SAMPLES[key].label, key);
  }
});

test('in English the samples read as the original: the names the app\'s checks look for are there', () => {
  const { M } = loadApp({ search: '?lang=en' });
  const names = (key) => {
    const d = M.samples.makeSample(key);
    return [...d.domains.map((x) => x.name), ...d.components.map((x) => x.name), ...d.events.map((x) => x.name)];
  };
  assert.ok(names('onePdu').includes('PDU A trips'));
  assert.ok(names('usEast1').includes('Route 53 control plane'));
  assert.ok(names('onePdu').includes('Server room'));
  M.i18n.useLang('hr');
  assert.ok(!names('onePdu').includes('Server room'));
});

// ── import markers ──

test('the markers: data-sim is the folder name, meta matches sim.json, exceptions parse, the back link', async () => {
  const { metaFor } = await import('../../lib/manifest.mjs');
  assert.match(html, new RegExp(`<html lang="hr" data-sim="${ID}">`));
  assert.equal(entry.id, ID);
  assert.equal(entry.origin, ID);
  const meta = /id="simdeck-meta">(.*)<\/script>/.exec(html);
  assert.deepEqual(JSON.parse(meta[1]), metaFor(entry));
  const exc = JSON.parse(/id="simdeck-exceptions">(.*)<\/script>/.exec(html)[1]);
  assert.ok(exc.some((x) => x.rule === 'kit'));
  assert.ok(!('languages' in entry), 'both languages: no single-language exception');
  assert.match(html, /<a class="sd-back" data-sd-back href="\.\.\/\.\.\/index\.html"/);
});

// ── the app's own checks ──

test('the app\'s own checks pass: node tests/run.mjs (47)', () => {
  const r = spawnSync(process.execPath, [path.join(DIR, 'tests', 'run.mjs')], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout.split('\n').filter((l) => /FAIL/.test(l)).join('\n'));
  const m = /(\d+)\/(\d+) passed/.exec(r.stdout);
  assert.ok(m && m[1] === m[2] && Number(m[1]) >= 47, r.stdout.slice(-200));
});

// ── in a browser ──

test('every sample opens in Chromium from file:// in hr and en; events and cuts break; no error or missing string', async () => {
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  const url = pathToFileURL(path.join(DIR, 'index.html')).href;
  try {
    for (const lang of ['hr', 'en']) {
      for (const key of Object.keys(SAMPLES)) {
        const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
        const page = await ctx.newPage();
        const errors = [];
        page.on('pageerror', (e) => errors.push(String(e)));
        page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); });
        await page.goto(`${url}?lang=${lang}&sample=${key}`);
        await page.waitForFunction(() => document.querySelector('#verdict')?.className === 'up');
        assert.equal(await page.evaluate(() => document.documentElement.lang), lang);
        assert.equal(await page.inputValue('#sample-picker'), key, `${lang} ${key}: picker`);
        assert.equal(await page.evaluate(() => document.title), strings[lang]['ui.pageTitle']);
        // Breaking the first cut takes the service down, and the canvas marks what is down in words too.
        await page.click('#cutset-panel [data-cut]');
        await page.waitForFunction(() => document.querySelector('#verdict').className === 'down');
        assert.ok((await page.evaluate(() => document.querySelector('#canvas').textContent)).includes('✕ '), `${lang} ${key}: no ✕ on what is down`);
        await page.click('#reset');
        await page.waitForFunction(() => document.querySelector('#verdict').className === 'up');
        // Every event on the rail toggles on and off.
        const n = await page.locator('#event-list [data-ev]').count();
        assert.ok(n > 2, `${lang} ${key}: ${n} events`);
        await page.locator('#event-list [data-ev]').last().click();
        assert.equal(await page.locator('#event-list .ev.on').count(), 1);
        await page.locator('#event-list [data-ev]').last().click();
        assert.equal(await page.locator('#event-list .ev.on').count(), 0);
        // Search sizes and hiding the authorities re-run the analysis.
        await page.selectOption('#max-size', '1');
        await page.uncheck('#toggle-auth');
        await page.check('#toggle-auth');
        const text = await page.evaluate(() => document.body.innerText + document.querySelector('#canvas').textContent);
        assert.doesNotMatch(text, /\b(ui|ev|cut|hl|st|scope1|scopeN|role|kind|cv|auth|authq|s)\.[a-zA-Z]+\b(?!\.)/, `${lang} ${key}: a raw key on the page`);
        if (lang === 'hr') {
          // The words the original wrote in English, and the engine still does, are gone from the Croatian page.
          for (const w of [' lost', 'Membership', 'Not drawn', 'not drawn', 'Single points', ' hit', 'searched', 'Server room']) {
            assert.ok(!text.includes(w), `${key}: "${w}" on the Croatian page`);
          }
        }
        assert.deepEqual(errors, [], `${lang} ${key}`);
        await ctx.close();
      }
    }
    // The language button keeps the sample; ?theme= and the OS pick the theme.
    const page = await browser.newPage();
    await page.goto(`${url}?lang=hr&sample=onePdu`);
    await page.click('#btn-lang');
    await page.waitForFunction(() => document.documentElement.lang === 'en');
    assert.match(page.url(), /sample=onePdu/);
    assert.equal(await page.inputValue('#sample-picker'), 'onePdu');
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto(`${url}?lang=en`);
    assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'dark');
    assert.equal(await page.evaluate(() => document.querySelector('#canvas').style.getPropertyValue('--paper')), '#0f172a');
    await page.goto(`${url}?lang=en&theme=light`);
    assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'light');
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto(`${url}?lang=en&theme=dark`);
    assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'dark');
  } finally {
    await browser.close();
  }
});
