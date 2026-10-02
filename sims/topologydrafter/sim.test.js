// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the topologydrafter import. Run: node --test sims/topologydrafter/sim.test.js
// The app is ES modules in js/, bundled once into app.js (bundle.mjs). These tests load the bundle itself in a
// node vm (a stub canvas measures text), check the bundler, the two languages, the samples and the import
// markers, and run the app's own smoke test (tests/smoke.html) in Chromium from file:// in both languages.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { pathToFileURL } = require('node:url');
const kit = require('../../kit/kit.js');
const strings = require('./strings.js');

const ID = 'topologydrafter';
const DIR = __dirname;
const read = (f) => fs.readFileSync(path.join(DIR, f), 'utf8');
const html = read('index.html');
const entry = JSON.parse(read('sim.json'));
const SAMPLE_IDS = ['two-sites', 'dmz', 'campus'];

/** A fresh copy of the bundle in a vm, not booted; `env` sets location, localStorage and <html lang>. */
function loadApp(env = {}) {
  const errors = [];
  const store = new Map(Object.entries(env.stored || {}));
  const sandbox = {
    console: { log() {}, warn() {}, error: (...a) => errors.push(a.join(' ')) },
    SimStrings: strings,
    TOPOLOGYDRAFTER_NO_BOOT: true,
    setTimeout, clearTimeout, URLSearchParams,
    localStorage: { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)) },
    document: {
      documentElement: { lang: env.htmlLang ?? 'hr' },
      // geom.js measures label widths on a canvas: about 7 px per character is close enough for layout rules.
      createElement: () => ({ getContext: () => ({ font: '', measureText: (s) => ({ width: String(s).length * 7 }) }) }),
    },
  };
  if (env.search !== undefined) sandbox.location = { search: env.search };
  vm.createContext(sandbox);
  vm.runInContext(read('app.js'), sandbox, { filename: 'app.js' });
  return { M: sandbox.TopologyDrafter.modules, errors };
}

// ── the bundle ──

test('app.js is what bundle.mjs makes of js/ (no hand edits, not stale)', async () => {
  const { bundle } = await import(pathToFileURL(path.join(DIR, 'bundle.mjs')).href);
  assert.equal(read('app.js'), bundle());
});

test('bundler: named imports with `as`, the export forms, dependency order', async () => {
  const { transform, order } = await import(pathToFileURL(path.join(DIR, 'bundle.mjs')).href);
  const m = transform('x', "import {\n  a, b as c,\n} from './y.js';\nexport const K = 1;\nexport async function f() {}\nfunction g() {}\nexport { g };\n");
  assert.deepEqual(m.deps, ['y']);
  assert.match(m.body, /const \{ a, b: c \} = __mods\["y"\];/);
  assert.deepEqual(m.exports.sort(), ['K', 'f', 'g']);
  assert.doesNotMatch(m.body, /^\s*(import|export)\b/m);
  const mods = new Map([['main', { deps: ['b', 'a'] }], ['a', { deps: [] }], ['b', { deps: ['a'] }]]);
  assert.deepEqual(order(mods, 'main'), ['a', 'b', 'main']);
});

test('bundler refuses what it cannot bundle: default exports, namespace imports, cycles, missing modules', async () => {
  const { transform, order } = await import(pathToFileURL(path.join(DIR, 'bundle.mjs')).href);
  assert.throws(() => transform('x', 'export default 1;\n'), /cannot bundle/);
  assert.throws(() => transform('x', "import * as y from './y.js';\n"), /cannot bundle/);
  assert.throws(() => order(new Map([['main', { deps: ['a'] }], ['a', { deps: ['main'] }]]), 'main'), /cycle/);
  assert.throws(() => order(new Map([['main', { deps: ['a'] }]]), 'main'), /missing module a\.js/);
});

test('the page loads strings.js, then app.js, as classic scripts (the build inlines no modules)', () => {
  assert.doesNotMatch(html, /type="module"/);
  const s = html.indexOf('<script src="strings.js"></script>');
  const a = html.indexOf('<script src="app.js"></script>');
  assert.ok(s > 0 && a > s);
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
  assert.equal(lang({ search: '?lang=fr', htmlLang: 'de' }), 'hr');
});

test('Croatian plurals: 1 / 2–4 / 5+, and 11–14 take the third form', () => {
  const { M } = loadApp({ search: '?lang=hr' });
  const n = (k) => M.i18n.t('n.device', { n: k });
  assert.deepEqual([1, 2, 4, 5, 11, 12, 14, 21, 22, 25, 101].map(n),
    ['1 uređaj', '2 uređaja', '4 uređaja', '5 uređaja', '11 uređaja', '12 uređaja', '14 uređaja', '21 uređaj',
      '22 uređaja', '25 uređaja', '101 uređaj']);
  assert.equal(M.i18n.t('n.link', { n: 3 }), '3 veze');
  assert.equal(M.i18n.t('n.link', { n: 13 }), '13 veza');
  M.i18n.useLang('en');
  assert.deepEqual([1, 2, 11].map(n), ['1 device', '2 devices', '11 devices']);
});

test('every catalog label exists in both languages', () => {
  const { M, errors } = loadApp();
  const C = M.catalog;
  for (const l of ['hr', 'en']) {
    M.i18n.useLang(l);
    const all = [
      ...Object.values(C.DEVICES), ...Object.values(C.SERVICES), ...Object.values(C.SERVICE_GROUPS),
      ...C.DEVICE_CATEGORIES, ...Object.values(C.LINK_KINDS), ...C.ZONE_COLORS,
    ];
    for (const x of all) assert.ok(x.label && !/^(dev|svc|grp|cat|link|zone)\./.test(x.label), `${l}: ${x.label}`);
  }
  assert.deepEqual(errors, []);
});

test('every literal t() key and data-t* key in the page and js/ is in the table', () => {
  const sources = [html, ...fs.readdirSync(path.join(DIR, 'js')).map((f) => read(`js/${f}`))].join('\n');
  const keys = new Set();
  for (const m of sources.matchAll(/\bt\('([\w.-]+)'/g)) keys.add(m[1]);
  for (const m of sources.matchAll(/data-t(?:-title|-label|-placeholder)?="([\w.-]+)"/g)) keys.add(m[1]);
  assert.ok(keys.size > 80, `found ${keys.size} keys`);
  for (const k of keys) for (const l of ['hr', 'en']) assert.ok(k in strings[l], `${l}: ${k}`);
});

test('a typed name survives a type change; a default name in either language follows the type', () => {
  const { M } = loadApp();
  assert.ok(M.catalog.isDefaultLabel('Usmjernik'));
  assert.ok(M.catalog.isDefaultLabel('Router'));
  assert.ok(!M.catalog.isDefaultLabel('DC01'));
});

// ── samples (the preset entries) ──

/** Every text a sample draws: title, node labels and sublabels, link labels, zone labels, notes. */
function texts(doc) {
  return [doc.title, ...doc.nodes.flatMap((n) => [n.label, n.sublabel]),
    ...doc.links.flatMap((l) => [l.label, l.fromLabel, l.toLabel]), ...doc.zones.map((z) => z.label),
    ...doc.notes.map((t) => t.text)].filter(Boolean);
}

test('samples are consistent in both languages: endpoints, kinds, types and services exist', () => {
  const { M } = loadApp();
  const C = M.catalog;
  for (const l of ['hr', 'en']) {
    M.i18n.useLang(l);
    for (const id of SAMPLE_IDS) {
      const doc = M.samples.makeSample(id);
      const ids = new Set(doc.nodes.map((n) => n.id));
      for (const k of doc.links) {
        assert.ok(ids.has(k.from) && ids.has(k.to), `${l} ${id}: link ${k.id}`);
        assert.ok(C.LINK_KINDS[k.kind], `${l} ${id}: kind ${k.kind}`);
      }
      for (const n of doc.nodes) {
        assert.ok(C.DEVICES[n.type], `${l} ${id}: type ${n.type}`);
        for (const s of n.services) assert.ok(C.SERVICES[s], `${l} ${id}: service ${s}`);
      }
    }
  }
  assert.equal(M.samples.makeSample('no-such-sample'), null);
});

test('a sample is the same drawing in both languages; only its words change', () => {
  const { M } = loadApp();
  const strip = (doc) => JSON.stringify(doc, (k, v) => (['title', 'label', 'sublabel', 'text'].includes(k) ? '' : v));
  for (const id of SAMPLE_IDS) {
    M.i18n.useLang('hr');
    const hr = M.samples.makeSample(id);
    M.i18n.useLang('en');
    const en = M.samples.makeSample(id);
    assert.equal(strip(hr), strip(en), id);
    assert.notDeepEqual(texts(hr), texts(en), id);
  }
});

test('no English table string is left in a Croatian sample', () => {
  const { M } = loadApp();
  M.i18n.useLang('hr');
  const english = new Set(Object.keys(strings.en).filter((k) => strings.en[k] !== strings.hr[k]).map((k) => strings.en[k]));
  for (const id of SAMPLE_IDS) {
    for (const s of texts(M.samples.makeSample(id))) assert.ok(!english.has(s), `${id}: "${s}"`);
  }
});

test('the dmz sample reveals in steps 0–2; the others draw everything at step 0', () => {
  const { M } = loadApp();
  const max = (id) => {
    M.state.loadDoc(M.samples.makeSample(id));
    return M.state.maxStep();
  };
  assert.deepEqual(SAMPLE_IDS.map(max), [0, 2, 0]);
});

test('sim.json entries are the samples, each opened in presentation mode', () => {
  const { M } = loadApp();
  assert.deepEqual(Array.from(M.samples.SAMPLES, (s) => s.id), SAMPLE_IDS);
  assert.deepEqual(entry.entries.map((x) => [x.preset, x.query]),
    SAMPLE_IDS.map((id) => [id, `sample=${id}&present=1`]));
});

// ── concepts, not tools (docs/tasks/COMMON.md §1) ──

test('no product names on the page: generic labels for the firewall, hypervisor and container entries', () => {
  const sources = [html, read('strings.js'), ...fs.readdirSync(path.join(DIR, 'js')).map((f) => read(`js/${f}`))].join('\n');
  for (const name of ['pfSense', 'OPNsense', 'Samba', 'VMware', 'ESXi', 'Proxmox', 'Docker', 'Kubernetes', 'Entra', 'Packet Tracer']) {
    assert.ok(!sources.includes(name), name);
  }
});

// ── import markers ──

test('the markers: data-sim is the folder name, meta matches sim.json, exceptions parse', async () => {
  const { metaFor } = await import('../../lib/manifest.mjs');
  assert.match(html, new RegExp(`<html lang="hr" data-sim="${ID}">`));
  assert.equal(entry.id, ID);
  assert.equal(entry.origin, ID);
  const meta = /id="simdeck-meta">(.*)<\/script>/.exec(html);
  assert.deepEqual(JSON.parse(meta[1]), metaFor(entry));
  const exc = JSON.parse(/id="simdeck-exceptions">(.*)<\/script>/.exec(html)[1]);
  assert.ok(exc.some((x) => x.rule === 'kit'));
  assert.ok(!('languages' in entry), 'both languages: no single-language exception');
});

// ── the app's own smoke test, in a browser ──

test('tests/smoke.html passes in Chromium from file://, in hr and en', async () => {
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  try {
    for (const lang of ['hr', 'en']) {
      const page = await browser.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(String(e)));
      page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
      await page.goto(`${pathToFileURL(path.join(DIR, 'tests', 'smoke.html')).href}?lang=${lang}`);
      await page.waitForFunction(() => /^(PASS|FAIL)/.test(document.title));
      const failed = await page.evaluate(() => [...document.querySelectorAll('li.fail')].map((li) => li.textContent));
      const count = await page.evaluate(() => document.querySelectorAll('#results li').length);
      assert.deepEqual(failed, [], lang);
      assert.deepEqual(errors, [], lang);
      assert.ok(count >= 20, `${lang}: ${count} checks`);
      await page.close();
    }
  } finally {
    await browser.close();
  }
});
