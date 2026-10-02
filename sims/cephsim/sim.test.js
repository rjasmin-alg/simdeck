// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the cephsim import. Run: node --test sims/cephsim/sim.test.js
// The app is ES modules in js/, bundled once into app.js (bundle.mjs). These tests check the bundler and the bundle,
// the two languages (tables, keys, plurals, the engine's sentences), the samples and the import markers; run the
// app's own 148 checks (node tests/run.mjs); and open the page in Chromium from file://, every sample in both
// languages, every tab and every kind of inspector panel, with no console error and no missing string.
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

const ID = 'cephsim';
const DIR = __dirname;
const read = (f) => fs.readFileSync(path.join(DIR, f), 'utf8');
const html = read('index.html');
const entry = JSON.parse(read('sim.json'));
// The task's sample keys (the app's own ids, used in ?sample=) and the kebab-case preset ids of sim.json.
const SAMPLES = { hyperconverged: 'hyperconverged', threeRacks: 'three-racks', brokenRule: 'broken-rule', unbalanced: 'unbalanced' };

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
    CEPHSIM_NO_BOOT: true,
    setTimeout, clearTimeout, URLSearchParams, queueMicrotask, performance,
    localStorage: { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) },
    document: { documentElement: { lang: env.htmlLang ?? 'hr' } },
  };
  if (env.search !== undefined) sandbox.location = { search: env.search };
  vm.createContext(sandbox);
  vm.runInContext(read('app.js'), sandbox, { filename: 'app.js' });
  return { M: sandbox.CephSim.modules, errors };
}

// ── the bundle ──

test('app.js is what bundle.mjs makes of js/ (no hand edits, not stale)', async () => {
  const { bundle } = await import(pathToFileURL(path.join(DIR, 'bundle.mjs')).href);
  assert.equal(read('app.js'), bundle());
});

test('bundler: subfolder paths, named imports with `as`, lazy imports, the export forms, dependency order', async () => {
  const { transform, order, resolve } = await import(pathToFileURL(path.join(DIR, 'bundle.mjs')).href);
  assert.equal(resolve('engine/crush', './hash.js'), 'engine/hash');
  assert.equal(resolve('main', './engine/capacity.js'), 'engine/capacity');
  assert.equal(resolve('engine/net', '../model.js'), 'model');
  assert.throws(() => resolve('main', '../outside.js'), /leaves js/);
  const m = transform('engine/x', "import {\n  a, b as c,\n} from './y.js';\nimport { d } from '../z.js';\n"
    + "export const K = 1;\nexport class C {}\nexport async function f() { return import('./y.js'); }\nfunction g() {}\nexport { g };\n");
  assert.deepEqual(m.deps, ['engine/y', 'z']);
  assert.match(m.body, /const \{ a, b: c \} = __mods\["engine\/y"\];/);
  assert.match(m.body, /return Promise\.resolve\(__mods\["engine\/y"\]\)/);
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
  assert.throws(() => transform('x', 'const m = import(name);\n'), /cannot bundle/);
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
  assert.ok(M.main === undefined, 'main must not run under CEPHSIM_NO_BOOT');
  assert.ok(M['engine/crush'] && M.compile && M.samples && M.i18n);
  assert.deepEqual(errors, []);
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
  const forms = strings.hr['ins.nPools'];
  const n = (k) => M.i18n.t('ins.nPools', { n: k });
  const want = (i, k) => forms[i].replace('{n}', k);
  assert.deepEqual([1, 2, 4, 5, 11, 12, 14, 21, 22, 25, 101].map(n),
    [want(0, 1), want(1, 2), want(1, 4), want(2, 5), want(2, 11), want(2, 12), want(2, 14), want(0, 21),
      want(1, 22), want(2, 25), want(0, 101)]);
  M.i18n.useLang('en');
  assert.deepEqual([1, 2, 11].map(n), [strings.en['ins.nPools'][0].replace('{n}', 1),
    strings.en['ins.nPools'][1].replace('{n}', 2), strings.en['ins.nPools'][1].replace('{n}', 11)]);
});

test('every literal t() key and data-t* key in the page and js/ is in the table, and every table key is used', () => {
  const sources = [html, ...jsFiles().map((f) => read(`js/${f}`))].join('\n');
  const keys = new Set();
  for (const m of sources.matchAll(/\bt\('([\w.-]+)'/g)) keys.add(m[1]);
  for (const m of sources.matchAll(/data-t(?:-title|-label|-placeholder)?="([\w.-]+)"/g)) keys.add(m[1]);
  assert.ok(keys.size > 250, `found ${keys.size} keys`);
  for (const k of keys) for (const l of ['hr', 'en']) assert.ok(k in strings[l], `${l}: ${k}`);
  // Built keys: catalog getters (cat.<id>) and the engine templates (eng.*, matched in js/engine-text.js).
  const built = (k) => /^(cat|eng)\./.test(k);
  const unused = Object.keys(strings.en).filter((k) => !keys.has(k) && !built(k));
  assert.deepEqual(unused, []);
});

test('every catalog label and note exists in both languages, and they differ where a word is translated', () => {
  const { M, errors } = loadApp();
  const C = M.catalog;
  const labels = (l) => {
    M.i18n.useLang(l);
    return [...Object.values(C.CHASSIS), ...Object.values(C.SWITCHES), ...Object.values(C.NETS), ...C.BUCKET_TYPES,
      ...C.EC_PROFILES].map((x) => x.label).concat(Object.values(C.DAEMONS).map((d) => d.note));
  };
  const hr = labels('hr');
  const en = labels('en');
  for (const s of [...hr, ...en]) assert.ok(s && !/^(cat|eng)\./.test(s), s);
  assert.ok(hr.filter((s, i) => s !== en[i]).length >= hr.length - 2, 'most catalog words differ between hr and en');
  assert.deepEqual(errors, []);
});

// ── the engine's sentences ──

/** Health detail lines and client reasons from a set of failures that reach every check the engine writes. */
function engineLines(M) {
  const { makeSample } = M.samples;
  const { migrate } = M.model;
  const { evaluate, invalidate } = M.compile;
  const lines = [];
  // Each failure is evaluated against the healthy layout before it, as the page does, so moved PGs count.
  const run = (key, edit) => {
    const doc = migrate(makeSample(key));
    invalidate();
    const before = evaluate(doc, {});
    edit(doc);
    invalidate();
    const d = evaluate(doc, { prev: before.evals });
    for (const c of d.health.checks) lines.push(...c.detail);
    for (const group of [d.clients.filesystems, d.clients.rbd, d.clients.rgw]) for (const c of group) lines.push(...c.reasons);
  };
  const host = (doc, name) => doc.hosts.find((h) => h.name === name);
  const rack = (doc, n) => doc.hosts.filter((h) => h.name.startsWith(`ceph-r${n}-`));
  run('threeRacks', (d) => { d.switches.find((s) => s.name === 'spine').up = false; });           // split quorum
  run('threeRacks', (d) => { for (const h of rack(d, 1)) h.up = false; });                       // a rack down
  run('brokenRule', (d) => { for (const h of rack(d, 1)) h.up = false; });                       // PGs inactive
  run('hyperconverged', (d) => { d.hosts[0].up = false; d.hosts[1].up = false; });               // no majority, MDS
  run('hyperconverged', (d) => { for (const h of d.hosts) h.daemons = h.daemons.filter((x) => x !== 'mon' && x !== 'mgr'); });
  run('hyperconverged', (d) => { for (const h of d.hosts) h.daemons = h.daemons.filter((x) => x !== 'mgr'); d.hosts[0].daemons.push('mgr'); d.hosts[0].up = false; });
  run('hyperconverged', (d) => { d.hosts[0].osds[0].in = false; d.hosts[1].osds[0].up = false; });
  run('hyperconverged', (d) => { for (const h of d.hosts.slice(1)) h.daemons = h.daemons.filter((x) => x !== 'mds'); });
  run('hyperconverged', (d) => { d.pools[0].pg_num = d.pools[0].pgp_num = 4; d.pools[1].pg_num = d.pools[1].pgp_num = 4; });
  run('hyperconverged', (d) => { d.pools[0].pg_num = d.pools[0].pgp_num = 4096; });
  const fourthMon = (d) => d.hosts.push({ ...d.hosts[4], id: 'hx', name: 'ceph-x', osds: [], daemons: ['mon'] });
  run('threeRacks', fourthMon);                                                               // an even number
  run('threeRacks', (d) => {
    fourthMon(d);
    host(d, 'ceph-r1-1').up = false;                                                          // one down, quorum holds
    for (const h of d.hosts) h.daemons = h.daemons.filter((x) => x !== 'rgw');                // no gateway
    d.rbd[0].pool = 'nope';                                                                   // a missing pool
  });
  run('threeRacks', (d) => {
    const h = host(d, 'ceph-r2-2');
    for (const l of d.links) if (l.net === 'cluster' && (l.a === h.id || l.b === h.id)) l.up = false;
    const g = host(d, 'ceph-r3-2');
    for (const l of d.links) if (l.net === 'public' && (l.a === g.id || l.b === g.id)) l.up = false;
  });
  // A small host holds a whole copy on 16 TiB: 14, 14.8 and 16 TiB stored are nearfull, backfillfull and full.
  for (const tib of [14, 14.8, 16]) run('unbalanced', (d) => { d.pools[0].stored = tib * 1024 ** 4; });
  run('threeRacks', (d) => { d.hosts[0].osds[0].reweight = 0.5; });                               // misplaced
  return lines;
}

test('in Croatian every engine sentence is a known template and comes out translated', () => {
  const { M, errors } = loadApp({ search: '?lang=hr' });
  const lines = [...new Set(engineLines(M))];
  assert.ok(lines.length > 30, `${lines.length} lines`);
  const { engineText, isKnownEngineText } = M['engine-text'];
  // A sentence that is all data reads the same in both languages (osd.3 (ceph-01) reweight 0).
  // (osd.{id} ({host}) — {why} and {host} — {why} are the same too, but their {why} is translated.)
  const same = Object.keys(strings.en).filter((k) => k.startsWith('eng.') && strings.en[k] === strings.hr[k]
    && !strings.en[k].includes('{why}'))
    .map((k) => new RegExp(`^${strings.en[k].replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\{\w+\\\}/g, '.+?')}$`));
  assert.ok(same.length <= 1, 'eng.reweight0 is the only template that is all data');
  // The English words of the templates (pieces between placeholders), where Croatian has none of them.
  const hrAll = Object.keys(strings.hr).filter((k) => k.startsWith('eng.')).map((k) => strings.hr[k]).join('\n');
  const english = [...new Set(Object.keys(strings.en).filter((k) => k.startsWith('eng.'))
    .flatMap((k) => strings.en[k].split(/\{\w+\}/)).map((x) => x.trim()).filter((x) => /[a-z]{3}/.test(x) && !hrAll.includes(x)))];
  assert.ok(english.length > 30, `${english.length} English pieces`);
  for (const line of lines) {
    assert.ok(isKnownEngineText(line), `no template for: ${line}`);
    if (!same.some((re) => re.test(line))) assert.notEqual(engineText(line), line, `not translated: ${line}`);
    assert.doesNotMatch(engineText(line), /\{\w+\}/, `placeholder left: ${engineText(line)}`);
    for (const piece of english) assert.ok(!engineText(line).includes(piece), `"${piece}" left in: ${engineText(line)}`);
  }
  M.i18n.useLang('en');
  for (const line of lines) assert.equal(engineText(line), line, 'English passes through');
  assert.deepEqual(errors, []);
});

test('the failure scenarios reach nearly every engine template', () => {
  const { M } = loadApp({ search: '?lang=hr' });
  const lines = engineLines(M);
  const en = strings.en;
  const used = new Set();
  const nested = (s) => { for (const k of Object.keys(en).filter((x) => x.startsWith('eng.'))) {
    const re = new RegExp(`^${en[k].replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\{\w+\\\}/g, '(.+?)')}$`);
    const m = re.exec(s);
    if (m) { used.add(k); m.slice(1).forEach(nested); }
  } };
  lines.forEach(nested);
  const missed = Object.keys(en).filter((k) => k.startsWith('eng.') && !used.has(k));
  // Not reachable from a document: the engine says this only for a pool it was never asked to evaluate.
  assert.deepEqual(missed, ['eng.poolNotEvaluated']);
});

// ── samples (the preset entries) ──

test('sim.json entries are the four samples, by the app\'s own ?sample= keys', () => {
  const { M } = loadApp();
  assert.deepEqual(Object.keys(M.samples.SAMPLES), Object.keys(SAMPLES));
  assert.deepEqual(entry.entries.map((x) => [x.preset, x.query]),
    Object.entries(SAMPLES).map(([key, preset]) => [preset, `sample=${key}`]));
  assert.equal(M.samples.makeSample('no-such-sample'), null);
});

test('a sample is the same cluster in both languages; only its title changes', () => {
  const { M } = loadApp();
  for (const key of Object.keys(SAMPLES)) {
    M.i18n.useLang('hr');
    const hr = M.samples.makeSample(key);
    M.i18n.useLang('en');
    const en = M.samples.makeSample(key);
    assert.notEqual(hr.title, en.title, key);
    assert.equal(JSON.stringify({ ...hr, title: '' }), JSON.stringify({ ...en, title: '' }), key);
  }
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

test('the app\'s own checks pass: node tests/run.mjs (148)', () => {
  const r = spawnSync(process.execPath, [path.join(DIR, 'tests', 'run.mjs')], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout.split('\n').filter((l) => /FAIL/.test(l)).join('\n'));
  assert.match(r.stdout, /all (\d+) checks passed/);
  assert.ok(Number(/all (\d+) checks passed/.exec(r.stdout)[1]) >= 148);
});

// ── in a browser ──

test('every sample, tab and inspector panel opens in Chromium from file:// in hr and en, with no error or missing string', async () => {
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
        await page.waitForFunction(() => document.querySelector('#health')?.textContent.startsWith('HEALTH_'));
        assert.equal(await page.evaluate(() => document.documentElement.lang), lang);
        // Fixed in the copy: the Samples picker was never filled, and only the physical canvas had the theme.
        assert.deepEqual(await page.evaluate(() => [...document.querySelectorAll('#sample-picker option')].map((o) => o.value)),
          ['', ...Object.keys(SAMPLES)]);
        assert.deepEqual(await page.evaluate(() => [...document.querySelectorAll('svg.pane')]
          .map((el) => getComputedStyle(el).getPropertyValue('--paper').trim() !== '')), [true, true, true]);
        const title = await page.inputValue('#doc-title');
        assert.equal(title, strings[lang][`s.${key === 'brokenRule' ? 'brokenRule' : key}`], `${lang} ${key}: title`);
        // Every pane, then one inspector panel of each kind.
        for (const tab of ['physical', 'crush', 'osdmap', 'pools', 'console']) {
          await page.click(`.tab[data-tab="${tab}"]`);
          assert.equal(await page.evaluate((t) => document.querySelector(`.tab.active`)?.dataset.tab, tab), tab);
          const shown = await page.evaluate(() => [...document.querySelectorAll('#pane-host > .pane')]
            .filter((el) => getComputedStyle(el).display !== 'none').map((el) => el.id));
          assert.equal(shown.length, 1, `${lang} ${key} ${tab}: panes shown ${shown}`);
        }
        await page.evaluate(() => {
          const { model } = globalThis.CephSim.modules;
          const d = model.state.doc;
          const ids = [d.hosts[0].id, d.hosts[0].osds[0].id, d.switches[0]?.id, d.links[0]?.id, d.buckets[0].id,
            'pool:' + d.pools[0].id, 'rule:' + d.rules[0].id,
            d.fs[0] && 'fs:' + d.fs[0].id, d.rbd[0] && 'rbd:' + d.rbd[0].id, d.rgw[0] && 'rgw:' + d.rgw[0].id];
          for (const id of ids.filter((x) => x !== undefined && x !== null)) model.select(id);
          model.select(d.hosts[0].id);
          model.select(d.hosts[1].id, { additive: true });
          model.clearSelection();
        });
        // A failure, so the health section and the event log have something to say, and a tick of recovery.
        await page.evaluate(() => {
          const { model } = globalThis.CephSim.modules;
          model.commit('test');
          model.state.doc.hosts[0].osds[0].in = false;
          model.changed();
        });
        await page.waitForFunction(() => !document.querySelector('[data-sim="step"]').disabled);
        // Fixed in the copy: the inspector's health section showed the cluster one edit late.
        await page.waitForFunction(() => document.querySelector('#health').textContent !== 'HEALTH_OK');
        assert.equal(await page.evaluate(() => document.querySelector('#inspector .health-line')?.textContent),
          await page.evaluate(() => document.querySelector('#health').textContent), `${lang} ${key}: inspector health`);
        await page.click('[data-sim="step"]');
        await page.click('[data-sim="skip"]');
        const text = await page.evaluate(() => document.body.innerText);
        assert.doesNotMatch(text, /\b(ui|ins|pools|tl|ev|pal|cat|map|cv|con|s|toast|eng)\.[a-zA-Z-]+\b(?!\.)/, `${lang} ${key}: a raw key on the page`);
        assert.deepEqual(errors, [], `${lang} ${key}`);
        await ctx.close();
      }
    }
  } finally {
    await browser.close();
  }
});
